import { db } from "@xat/db";
import { channelLine, inboxes, contacts, conversations } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { createConversation, createMessage } from "../services/conversation.service";
import { createHmac } from "node:crypto";

/**
 * LINE Messaging API channel handler.
 *
 * Uses the LINE Messaging API to send and receive messages.
 *
 * Setup:
 * 1. Create a LINE Official Account and Messaging API channel
 * 2. Get channel access token and channel secret from LINE console
 * 3. Set webhook URL to /api/v1/channels/line/webhook
 */

const LINE_API_URL = "https://api.line.me/v2/bot";

interface LineEvent {
  type: string;
  timestamp: number;
  source: {
    type: string;
    userId: string;
  };
  replyToken: string;
  message?: {
    id: string;
    type: string;
    text?: string;
  };
}

export interface LineWebhookPayload {
  destination: string;
  events: LineEvent[];
}

export function verifySignature(body: string, signature: string, channelSecret: string): boolean {
  const hash = createHmac("SHA256", channelSecret).update(body).digest("base64");
  return hash === signature;
}

export async function sendLineMessage(channelAccessToken: string, replyToken: string, text: string) {
  const res = await fetch(`${LINE_API_URL}/message/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

export async function pushLineMessage(channelAccessToken: string, to: string, text: string) {
  const res = await fetch(`${LINE_API_URL}/message/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text }],
    }),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

export async function getLineProfile(channelAccessToken: string, userId: string) {
  const res = await fetch(`${LINE_API_URL}/profile/${userId}`, {
    headers: { Authorization: `Bearer ${channelAccessToken}` },
  });
  return res.json() as Promise<{
    displayName?: string;
    userId?: string;
    pictureUrl?: string;
    statusMessage?: string;
  }>;
}

export async function getChannelByLineChannelId(lineChannelId: string) {
  const [channel] = await db
    .select()
    .from(channelLine)
    .where(eq(channelLine.lineChannelId, lineChannelId))
    .limit(1);
  return channel ?? null;
}

export async function processInboundWebhook(
  accountId: number,
  inboxId: number,
  channelAccessToken: string,
  events: LineEvent[],
) {
  const results = [];

  for (const event of events) {
    if (event.type !== "message" || !event.message) continue;

    const senderId = event.source.userId;

    // Find or create contact
    const existingContacts = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, accountId),
          eq(contacts.identifier, `line:${senderId}`),
        ),
      )
      .limit(1);

    let contact = existingContacts[0];

    if (!contact) {
      let name = `LINE User ${senderId.slice(0, 8)}`;
      let avatarUrl: string | undefined;

      try {
        const profile = await getLineProfile(channelAccessToken, senderId);
        if (profile.displayName) name = profile.displayName;
        if (profile.pictureUrl) avatarUrl = profile.pictureUrl;
      } catch {
        // Profile fetch failed
      }

      const [newContact] = await db
        .insert(contacts)
        .values({
          accountId,
          name,
          identifier: `line:${senderId}`,
          avatarUrl,
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
          eq(conversations.status, 0),
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

    let content = "";
    switch (event.message.type) {
      case "text":
        content = event.message.text ?? "";
        break;
      case "image":
        content = "[Image]";
        break;
      case "video":
        content = "[Video]";
        break;
      case "audio":
        content = "[Audio]";
        break;
      case "file":
        content = "[File]";
        break;
      case "sticker":
        content = "[Sticker]";
        break;
      case "location":
        content = "[Location]";
        break;
      default:
        content = `[${event.message.type}]`;
    }

    if (!content) continue;

    const msg = await createMessage({
      accountId,
      conversationId: conversation.id,
      content,
      messageType: 0,
      senderType: "contact",
      senderId: contact.id,
    });

    results.push({ conversation, message: msg, contact });
  }

  return results;
}

export async function sendOutgoingMessage(
  inboxId: number,
  contactIdentifier: string,
  content: string,
) {
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(eq(inboxes.id, inboxId))
    .limit(1);

  if (!inbox?.channelId) throw new Error("LINE channel not found for inbox");

  const [channel] = await db
    .select()
    .from(channelLine)
    .where(eq(channelLine.id, inbox.channelId))
    .limit(1);

  if (!channel) throw new Error("LINE channel not found");

  const userId = contactIdentifier.replace(/^line:/, "");

  const result = await pushLineMessage(channel.channelAccessToken, userId, content);

  if ((result as Record<string, unknown>).message) {
    throw new Error(`LINE API error: ${JSON.stringify(result)}`);
  }

  return result;
}
