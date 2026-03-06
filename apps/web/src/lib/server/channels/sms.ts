import { db } from "@xat/db";
import { channelSms, inboxes, contacts, conversations } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { createConversation, createMessage } from "../services/conversation.service";

/**
 * SMS channel handler using Twilio.
 *
 * Uses the Twilio REST API to send and receive SMS messages.
 *
 * Setup:
 * 1. Create a Twilio account
 * 2. Get Account SID, Auth Token, and phone number
 * 3. Set webhook URL to /api/v1/channels/sms/webhook in Twilio console
 */

const TWILIO_API_URL = "https://api.twilio.com/2010-04-01";

export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
}

export async function sendSms(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string,
) {
  const url = `${TWILIO_API_URL}/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const params = new URLSearchParams();
  params.set("From", from);
  params.set("To", to);
  params.set("Body", body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  return res.json() as Promise<Record<string, unknown>>;
}

export async function getChannelByPhoneNumber(phoneNumber: string) {
  const [channel] = await db
    .select()
    .from(channelSms)
    .where(eq(channelSms.phoneNumber, phoneNumber))
    .limit(1);
  return channel ?? null;
}

export async function processInboundWebhook(
  accountId: number,
  inboxId: number,
  payload: TwilioWebhookPayload,
) {
  const senderPhone = payload.From;

  // Find or create contact
  const existingContacts = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.accountId, accountId),
        eq(contacts.phoneNumber, senderPhone),
      ),
    )
    .limit(1);

  let contact = existingContacts[0];

  if (!contact) {
    const [newContact] = await db
      .insert(contacts)
      .values({
        accountId,
        name: senderPhone,
        phoneNumber: senderPhone,
        identifier: `sms:${senderPhone}`,
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

  let content = payload.Body || "";
  const numMedia = parseInt(payload.NumMedia ?? "0");
  if (numMedia > 0 && payload.MediaUrl0) {
    content += content ? "\n" : "";
    content += `[Media: ${payload.MediaUrl0}]`;
  }

  const msg = await createMessage({
    accountId,
    conversationId: conversation.id,
    content,
    messageType: 0,
    senderType: "contact",
    senderId: contact.id,
  });

  return { conversation, message: msg, contact };
}

export async function sendOutgoingMessage(
  inboxId: number,
  contactPhoneNumber: string,
  content: string,
) {
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(eq(inboxes.id, inboxId))
    .limit(1);

  if (!inbox?.channelId) throw new Error("SMS channel not found for inbox");

  const [channel] = await db
    .select()
    .from(channelSms)
    .where(eq(channelSms.id, inbox.channelId))
    .limit(1);

  if (!channel) throw new Error("SMS channel not found");

  const result = await sendSms(
    channel.accountSid,
    channel.authToken,
    channel.phoneNumber,
    contactPhoneNumber,
    content,
  );

  if ((result as Record<string, unknown>).error_code) {
    throw new Error(`Twilio error: ${JSON.stringify(result)}`);
  }

  return result;
}
