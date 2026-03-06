import { db } from "@xat/db";
import { channelTwitter, inboxes, contacts, conversations } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { createConversation, createMessage } from "../services/conversation.service";
import { createHmac } from "node:crypto";

/**
 * Twitter/X DM channel handler.
 *
 * Uses the Twitter API v2 to send and receive direct messages.
 *
 * Setup:
 * 1. Create a Twitter Developer App with OAuth 2.0 or 1.0a
 * 2. Enable DM read/write permissions
 * 3. Set webhook URL to /api/v1/channels/twitter/webhook
 * 4. Register webhook via Account Activity API
 */

const TWITTER_API_URL = "https://api.twitter.com/2";

interface TwitterDmEvent {
  id: string;
  event_type: string;
  text: string;
  sender_id: string;
  dm_conversation_id: string;
  created_at: string;
  attachments?: {
    media_keys?: string[];
  };
}

export interface TwitterWebhookPayload {
  for_user_id: string;
  direct_message_events?: Array<{
    type: string;
    id: string;
    created_timestamp: string;
    message_create: {
      target: { recipient_id: string };
      sender_id: string;
      message_data: {
        text: string;
        attachment?: { type: string; media: { media_url_https: string } };
      };
    };
  }>;
}

function generateOAuthHeader(
  method: string,
  url: string,
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessTokenSecret: string,
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = createHmac("sha256", timestamp).update(url).digest("hex").slice(0, 32);

  const params: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessTokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(signatureBase).digest("base64");

  params.oauth_signature = signature;

  return "OAuth " + Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ");
}

export async function sendTwitterDm(
  channel: { apiKey: string; apiSecret: string; accessToken: string; accessTokenSecret: string },
  recipientId: string,
  text: string,
) {
  const url = `${TWITTER_API_URL}/dm_conversations/with/${recipientId}/messages`;

  const authHeader = generateOAuthHeader(
    "POST",
    url,
    channel.apiKey,
    channel.apiSecret,
    channel.accessToken,
    channel.accessTokenSecret,
  );

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ text }),
  });

  return res.json() as Promise<Record<string, unknown>>;
}

export async function getChannelByTwitterAccountId(twitterAccountId: string) {
  const [channel] = await db
    .select()
    .from(channelTwitter)
    .where(eq(channelTwitter.twitterAccountId, twitterAccountId))
    .limit(1);
  return channel ?? null;
}

export async function processInboundWebhook(
  accountId: number,
  inboxId: number,
  payload: TwitterWebhookPayload,
) {
  const results = [];

  if (!payload.direct_message_events) return results;

  for (const event of payload.direct_message_events) {
    if (event.type !== "message_create") continue;
    // Skip messages sent by us
    if (event.message_create.sender_id === payload.for_user_id) continue;

    const senderId = event.message_create.sender_id;

    // Find or create contact
    const existingContacts = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, accountId),
          eq(contacts.identifier, `tw:${senderId}`),
        ),
      )
      .limit(1);

    let contact = existingContacts[0];

    if (!contact) {
      const [newContact] = await db
        .insert(contacts)
        .values({
          accountId,
          name: `Twitter User ${senderId}`,
          identifier: `tw:${senderId}`,
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

    let content = event.message_create.message_data.text;
    if (event.message_create.message_data.attachment) {
      const media = event.message_create.message_data.attachment.media;
      content += ` [${event.message_create.message_data.attachment.type}: ${media.media_url_https}]`;
    }

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

  if (!inbox?.channelId) throw new Error("Twitter channel not found for inbox");

  const [channel] = await db
    .select()
    .from(channelTwitter)
    .where(eq(channelTwitter.id, inbox.channelId))
    .limit(1);

  if (!channel) throw new Error("Twitter channel not found");

  const recipientId = contactIdentifier.replace(/^tw:/, "");

  const result = await sendTwitterDm(channel, recipientId, content);

  if ((result as Record<string, unknown>).errors) {
    throw new Error(`Twitter API error: ${JSON.stringify((result as Record<string, unknown>).errors)}`);
  }

  return result;
}
