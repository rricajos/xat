import { db } from "@xat/db";
import { channelSlack, inboxes, contacts, conversations, messages } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { createConversation, createMessage } from "../services/conversation.service";

/**
 * Slack channel handler.
 *
 * Allows receiving messages from a Slack workspace channel
 * and replying back via the Slack API.
 *
 * Flow:
 * 1. Slack sends events via Event Subscriptions to our webhook
 * 2. We process incoming messages and create conversations/contacts
 * 3. Agent replies are sent back to Slack via Web API
 */

interface SlackIncomingMessage {
  teamId: string;
  channelId: string;
  userId: string;
  userName?: string;
  text: string;
  ts: string;
  threadTs?: string;
}

export async function processSlackMessage(
  accountId: number,
  inboxId: number,
  message: SlackIncomingMessage,
) {
  // Find or create contact from Slack user
  const slackIdentifier = `slack:${message.teamId}:${message.userId}`;

  const existingContacts = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.accountId, accountId),
        eq(contacts.identifier, slackIdentifier),
      ),
    )
    .limit(1);

  let contact = existingContacts[0];

  if (!contact) {
    const [newContact] = await db
      .insert(contacts)
      .values({
        accountId,
        name: message.userName ?? `Slack User ${message.userId}`,
        identifier: slackIdentifier,
      })
      .returning();
    contact = newContact!;
  }

  // Check if this is a thread reply (existing conversation)
  let conversation = null;

  if (message.threadTs) {
    const existingMsg = await db
      .select({ conversationId: messages.conversationId })
      .from(messages)
      .where(
        and(
          eq(messages.accountId, accountId),
          eq(messages.sourceId, message.threadTs),
        ),
      )
      .limit(1);

    if (existingMsg[0]) {
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, existingMsg[0].conversationId))
        .limit(1);
      conversation = conv ?? null;
    }
  }

  if (!conversation) {
    conversation = await createConversation({
      accountId,
      inboxId,
      contactId: contact.id,
      status: 0,
    });
  }

  const msg = await createMessage({
    accountId,
    conversationId: conversation!.id,
    content: message.text,
    messageType: 0, // incoming
    senderType: "Contact",
    senderId: contact.id,
  });

  // Store Slack thread ts as source_id for thread tracking
  if (!message.threadTs) {
    await db
      .update(messages)
      .set({ sourceId: message.ts })
      .where(eq(messages.id, msg!.id));
  }

  return { conversation, message: msg, contact };
}

export async function sendSlackReply(params: {
  accountId: number;
  inboxId: number;
  conversationId: number;
  text: string;
  threadTs?: string;
}) {
  // Get Slack channel config
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(
      and(eq(inboxes.id, params.inboxId), eq(inboxes.accountId, params.accountId)),
    )
    .limit(1);

  if (!inbox?.channelId) return;

  const [slackConfig] = await db
    .select()
    .from(channelSlack)
    .where(
      and(
        eq(channelSlack.id, inbox.channelId),
        eq(channelSlack.accountId, params.accountId),
      ),
    )
    .limit(1);

  if (!slackConfig?.botToken) return;

  // Find thread_ts from the first message source_id
  let threadTs = params.threadTs;
  if (!threadTs) {
    const [firstMsg] = await db
      .select({ sourceId: messages.sourceId })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, params.conversationId),
          eq(messages.accountId, params.accountId),
        ),
      )
      .limit(1);

    threadTs = firstMsg?.sourceId ?? undefined;
  }

  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${slackConfig.botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: slackConfig.slackChannelId,
        text: params.text,
        ...(threadTs ? { thread_ts: threadTs } : {}),
      }),
    });
  } catch {
    // Slack API failure
  }
}
