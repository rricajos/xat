import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { processInboundEmail } from "$lib/server/channels/email";

/**
 * Webhook endpoint for receiving inbound emails from relay services
 * (e.g., Mailgun, SendGrid, Postmark).
 *
 * Each relay sends different payloads, so this handler expects a
 * normalized format. In production, you'd add adapter middleware
 * for each provider.
 */
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const {
    accountId,
    inboxId,
    from,
    fromName,
    to,
    subject,
    textBody,
    htmlBody,
    messageId,
    inReplyTo,
    references,
  } = body;

  if (!accountId || !inboxId || !from) {
    return json(
      { error: { message: "Missing required fields: accountId, inboxId, from" } },
      { status: 400 },
    );
  }

  const result = await processInboundEmail(accountId, inboxId, {
    from,
    fromName,
    to,
    subject: subject ?? "(no subject)",
    textBody,
    htmlBody,
    messageId,
    inReplyTo,
    references,
  });

  return json({
    data: {
      conversationId: result.conversation?.id ?? null,
      messageId: result.message?.id ?? null,
      contactId: result.contact?.id ?? null,
    },
  });
};
