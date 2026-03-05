import { db } from "@xat/db";
import { channelFacebook, inboxes, contacts, conversations } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { createConversation, createMessage } from "../services/conversation.service";

/**
 * Facebook Messenger channel handler.
 *
 * Uses the Facebook Graph API to send and receive messages
 * via a Facebook Page and its associated Messenger integration.
 *
 * Setup:
 * 1. Create a Facebook App and add the Messenger product
 * 2. Generate a page access token with pages_messaging permission
 * 3. Set the webhook URL to /api/v1/channels/facebook/webhook
 * 4. Subscribe to messages, messaging_postbacks webhook events
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface MessengerEntry {
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
    postback?: {
      title: string;
      payload: string;
    };
  }>;
}

interface MessengerWebhookPayload {
  object: string;
  entry: MessengerEntry[];
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

export async function sendFacebookMessage(
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
    `${GRAPH_API_URL}/${userId}?fields=first_name,last_name,profile_pic&access_token=${pageAccessToken}`,
  );
  return res.json() as Promise<{
    first_name?: string;
    last_name?: string;
    profile_pic?: string;
    error?: { message: string };
  }>;
}

export async function getChannelByPageId(pageId: string) {
  const [channel] = await db
    .select()
    .from(channelFacebook)
    .where(eq(channelFacebook.pageId, pageId))
    .limit(1);
  return channel ?? null;
}

export async function processInboundWebhook(
  accountId: number,
  inboxId: number,
  pageAccessToken: string,
  entry: MessengerEntry,
) {
  const results = [];

  for (const event of entry.messaging) {
    if (!event.message && !event.postback) continue;

    const senderId = event.sender.id;

    // Find or create contact
    const existingContacts = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, accountId),
          eq(contacts.identifier, senderId),
        ),
      )
      .limit(1);

    let contact = existingContacts[0];

    if (!contact) {
      // Fetch user profile from Facebook
      let name = `Facebook User ${senderId}`;
      let avatarUrl: string | undefined;

      try {
        const profile = await getUserProfile(pageAccessToken, senderId);
        if (profile.first_name) {
          name = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
        }
        if (profile.profile_pic) {
          avatarUrl = profile.profile_pic;
        }
      } catch {
        // Profile fetch failed, use default name
      }

      const [newContact] = await db
        .insert(contacts)
        .values({
          accountId,
          name,
          identifier: senderId,
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
    let content = "";
    if (event.message?.text) {
      content = event.message.text;
    } else if (event.postback) {
      content = event.postback.title;
    } else if (event.message?.attachments) {
      const attachment = event.message.attachments[0];
      if (attachment) {
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
      messageType: 0, // incoming
      senderType: "contact",
      senderId: contact.id,
    });

    results.push({ conversation, message: msg, contact });
  }

  return results;
}

/**
 * Send an outgoing message to a Facebook Messenger user.
 */
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

  if (!inbox?.channelId) throw new Error("Facebook channel not found for inbox");

  const [channel] = await db
    .select()
    .from(channelFacebook)
    .where(eq(channelFacebook.id, inbox.channelId))
    .limit(1);

  if (!channel) throw new Error("Facebook channel not found");

  const result = await sendFacebookMessage(
    channel.pageAccessToken,
    contactIdentifier,
    content,
  );

  if ((result as Record<string, unknown>).error) {
    throw new Error(`Facebook API error: ${JSON.stringify((result as Record<string, unknown>).error)}`);
  }

  return result;
}
