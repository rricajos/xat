import { db } from "@xat/db";
import { channelInstagram, inboxes, contacts, conversations } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { createConversation, createMessage } from "../services/conversation.service";

/**
 * Instagram Messaging channel handler.
 *
 * Uses the Instagram Graph API (via Facebook) to send and receive DMs.
 * Requires a Facebook App with Instagram Messaging permissions.
 *
 * Setup:
 * 1. Create a Facebook App with Instagram Messaging product
 * 2. Connect an Instagram Business/Creator account
 * 3. Generate page access token with instagram_manage_messages permission
 * 4. Set webhook URL to /api/v1/channels/instagram/webhook
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface InstagramWebhookEntry {
  id: string;
  time: number;
  messaging: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
      attachments?: Array<{
        type: string;
        payload: { url?: string };
      }>;
    };
  }>;
}

export interface InstagramWebhookPayload {
  object: string;
  entry: InstagramWebhookEntry[];
}

async function callGraphApi(
  pageAccessToken: string,
  endpoint: string,
  body: Record<string, unknown>,
) {
  const res = await fetch(`${GRAPH_API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pageAccessToken}`,
    },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<Record<string, unknown>>;
}

export async function sendInstagramMessage(
  pageAccessToken: string,
  recipientId: string,
  text: string,
) {
  return callGraphApi(pageAccessToken, "me/messages", {
    recipient: { id: recipientId },
    message: { text },
    messaging_type: "RESPONSE",
  });
}

export async function getUserProfile(pageAccessToken: string, userId: string) {
  const res = await fetch(
    `${GRAPH_API_URL}/${userId}?fields=name,username,profile_pic&access_token=${pageAccessToken}`,
  );
  return res.json() as Promise<{
    name?: string;
    username?: string;
    profile_pic?: string;
    error?: { message: string };
  }>;
}

export async function getChannelByInstagramId(instagramId: string) {
  const [channel] = await db
    .select()
    .from(channelInstagram)
    .where(eq(channelInstagram.instagramId, instagramId))
    .limit(1);
  return channel ?? null;
}

export async function processInboundWebhook(
  accountId: number,
  inboxId: number,
  pageAccessToken: string,
  entry: InstagramWebhookEntry,
) {
  const results = [];

  for (const event of entry.messaging) {
    if (!event.message) continue;

    const senderId = event.sender.id;

    // Find or create contact
    const existingContacts = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, accountId),
          eq(contacts.identifier, `ig:${senderId}`),
        ),
      )
      .limit(1);

    let contact = existingContacts[0];

    if (!contact) {
      let name = `Instagram User ${senderId}`;
      let avatarUrl: string | undefined;

      try {
        const profile = await getUserProfile(pageAccessToken, senderId);
        if (profile.name) name = profile.name;
        if (profile.profile_pic) avatarUrl = profile.profile_pic;
      } catch {
        // Profile fetch failed, use default
      }

      const [newContact] = await db
        .insert(contacts)
        .values({
          accountId,
          name,
          identifier: `ig:${senderId}`,
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

    let content = event.message.text ?? "";
    if (event.message.attachments) {
      const attachment = event.message.attachments[0];
      if (attachment && !content) {
        content = attachment.payload.url
          ? `[${attachment.type}: ${attachment.payload.url}]`
          : `[${attachment.type}]`;
      }
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

  if (!inbox?.channelId) throw new Error("Instagram channel not found for inbox");

  const [channel] = await db
    .select()
    .from(channelInstagram)
    .where(eq(channelInstagram.id, inbox.channelId))
    .limit(1);

  if (!channel) throw new Error("Instagram channel not found");

  const recipientId = contactIdentifier.replace(/^ig:/, "");

  const result = await sendInstagramMessage(
    channel.pageAccessToken,
    recipientId,
    content,
  );

  if ((result as Record<string, unknown>).error) {
    throw new Error(`Instagram API error: ${JSON.stringify((result as Record<string, unknown>).error)}`);
  }

  return result;
}
