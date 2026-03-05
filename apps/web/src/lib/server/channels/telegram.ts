import { db } from "@xat/db";
import { channelTelegram, inboxes, contacts, conversations } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { createConversation, createMessage } from "../services/conversation.service";
import { env } from "$env/dynamic/private";

/**
 * Telegram Bot API channel handler.
 *
 * Uses the Telegram Bot API (https://core.telegram.org/bots/api) to
 * send and receive messages via a bot token.
 *
 * Setup:
 * 1. Create a bot via @BotFather on Telegram
 * 2. Add the bot token to the channel_telegram record
 * 3. Set the webhook URL to /api/v1/channels/telegram/webhook
 */

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    date: number;
    text?: string;
    photo?: Array<{ file_id: string; file_unique_id: string; width: number; height: number }>;
    document?: { file_id: string; file_name?: string; mime_type?: string };
    sticker?: { file_id: string; emoji?: string };
    voice?: { file_id: string; duration: number };
  };
}

interface TelegramChannel {
  id: number;
  accountId: number;
  botToken: string;
  botUsername: string | null;
}

async function callTelegramApi(botToken: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<{ ok: boolean; result?: unknown; description?: string }>;
}

export async function setupWebhook(botToken: string, webhookUrl: string) {
  return callTelegramApi(botToken, "setWebhook", {
    url: webhookUrl,
    allowed_updates: ["message"],
  });
}

export async function removeWebhook(botToken: string) {
  return callTelegramApi(botToken, "deleteWebhook", {});
}

export async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  return callTelegramApi(botToken, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  });
}

export async function getChannelByInboxId(inboxId: number): Promise<TelegramChannel | null> {
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(eq(inboxes.id, inboxId))
    .limit(1);

  if (!inbox?.channelId) return null;

  const [channel] = await db
    .select()
    .from(channelTelegram)
    .where(eq(channelTelegram.id, inbox.channelId))
    .limit(1);

  return channel ?? null;
}

export async function processInboundUpdate(
  accountId: number,
  inboxId: number,
  update: TelegramUpdate,
) {
  const message = update.message;
  if (!message) return null;

  const telegramUserId = message.from.id.toString();
  const senderName = [message.from.first_name, message.from.last_name]
    .filter(Boolean)
    .join(" ");

  // Find or create contact
  const existingContacts = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.accountId, accountId),
        eq(contacts.identifier, telegramUserId),
      ),
    )
    .limit(1);

  let contact = existingContacts[0];

  if (!contact) {
    const [newContact] = await db
      .insert(contacts)
      .values({
        accountId,
        name: senderName || `Telegram User ${telegramUserId}`,
        identifier: telegramUserId,
        identifierHash: message.from.username ?? undefined,
      })
      .returning();
    contact = newContact!;
  }

  // Find existing open conversation or create new one
  const existingConversations = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.accountId, accountId),
        eq(conversations.inboxId, inboxId),
        eq(conversations.contactId, contact.id),
        eq(conversations.status, 0), // open
      ),
    )
    .limit(1);

  let conversation = existingConversations[0];

  if (!conversation) {
    conversation = await createConversation({
      accountId,
      inboxId,
      contactId: contact.id,
    });
  }

  // Build message content
  let content = message.text ?? "";
  if (message.sticker?.emoji) {
    content = message.sticker.emoji;
  }
  if (message.photo && message.photo.length > 0) {
    content = content || "[Photo]";
  }
  if (message.document) {
    content = content || `[File: ${message.document.file_name ?? "document"}]`;
  }
  if (message.voice) {
    content = content || "[Voice message]";
  }

  // Create the message
  const msg = await createMessage({
    accountId,
    conversationId: conversation.id,
    content,
    messageType: 0, // incoming
    senderType: "contact",
    senderId: contact.id,
  });

  return { conversation, message: msg, contact };
}

/**
 * Send an outgoing message to a Telegram user.
 * Called when an agent replies to a Telegram conversation.
 */
export async function sendOutgoingMessage(
  inboxId: number,
  contactIdentifier: string,
  content: string,
) {
  const channel = await getChannelByInboxId(inboxId);
  if (!channel) throw new Error("Telegram channel not found for inbox");

  const chatId = parseInt(contactIdentifier);
  if (isNaN(chatId)) throw new Error("Invalid Telegram chat ID");

  const result = await sendTelegramMessage(channel.botToken, chatId, content);
  if (!result.ok) {
    throw new Error(`Telegram API error: ${result.description ?? "Unknown error"}`);
  }

  return result;
}
