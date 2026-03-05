import { db } from "@xat/db";
import { channelEmail, inboxes, contacts, conversations, messages } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { createConversation, createMessage } from "../services/conversation.service";

/**
 * Email channel handler.
 *
 * In production, this would connect to IMAP servers and poll for new emails.
 * Currently provides the structure for processing inbound emails received
 * via webhook (e.g., from a relay service like Mailgun, SendGrid, or Postmark).
 */

interface InboundEmail {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
}

export async function processInboundEmail(
  accountId: number,
  inboxId: number,
  email: InboundEmail,
) {
  // Find or create contact from email sender
  const existingContacts = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.accountId, accountId), eq(contacts.email, email.from)))
    .limit(1);

  let contact = existingContacts[0];

  if (!contact) {
    const [newContact] = await db
      .insert(contacts)
      .values({
        accountId,
        name: email.fromName || email.from.split("@")[0],
        email: email.from,
      })
      .returning();
    contact = newContact!;
  }

  // Check if this is a reply to an existing conversation (via In-Reply-To or References headers)
  let conversation = null;

  if (email.inReplyTo) {
    // Look for existing messages with this messageId to find the conversation
    const existingMsg = await db
      .select({ conversationId: messages.conversationId })
      .from(messages)
      .where(
        and(
          eq(messages.accountId, accountId),
          eq(messages.sourceId, email.inReplyTo),
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

  // If no existing conversation, create a new one
  if (!conversation) {
    conversation = await createConversation({
      accountId,
      inboxId,
      contactId: contact!.id,
      status: 0,
    });
  }

  // Create the incoming message
  const content = email.textBody || email.htmlBody || email.subject;

  const message = await createMessage({
    accountId,
    conversationId: conversation!.id,
    content,
    messageType: 0, // incoming
    senderType: "Contact",
    senderId: contact!.id,
  });

  return { conversation, message, contact };
}

export async function sendOutboundEmail(params: {
  accountId: number;
  inboxId: number;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}) {
  // Get email channel config
  const inbox = await db
    .select()
    .from(inboxes)
    .where(
      and(eq(inboxes.id, params.inboxId), eq(inboxes.accountId, params.accountId)),
    )
    .limit(1);

  if (!inbox[0]) {
    throw new Error("Inbox not found");
  }

  const [emailConfig] = await db
    .select()
    .from(channelEmail)
    .where(
      and(
        eq(channelEmail.id, inbox[0].channelId!),
        eq(channelEmail.accountId, params.accountId),
      ),
    )
    .limit(1);

  if (!emailConfig?.smtpEnabled) {
    // TODO: Implement SMTP sending via nodemailer
    console.log("[Email Channel] SMTP sending not yet implemented", {
      to: params.to,
      subject: params.subject,
    });
    return;
  }

  // TODO: Use nodemailer with emailConfig SMTP settings
  // const transporter = nodemailer.createTransport({
  //   host: emailConfig.smtpAddress,
  //   port: emailConfig.smtpPort,
  //   secure: emailConfig.smtpEnableSslTls,
  //   auth: { user: emailConfig.smtpLogin, pass: emailConfig.smtpPassword },
  // });
  //
  // await transporter.sendMail({
  //   from: emailConfig.email,
  //   to: params.to,
  //   subject: params.subject,
  //   html: params.body,
  //   inReplyTo: params.inReplyTo,
  // });

  console.log("[Email Channel] Would send email:", {
    from: emailConfig.email,
    to: params.to,
    subject: params.subject,
  });
}
