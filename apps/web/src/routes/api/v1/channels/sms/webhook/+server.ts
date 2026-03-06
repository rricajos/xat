import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "@xat/db";
import { channelSms, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { processInboundWebhook } from "$lib/server/channels/sms";
import type { TwilioWebhookPayload } from "$lib/server/channels/sms";

/**
 * Twilio SMS webhook endpoint.
 *
 * Twilio sends POST requests with form-encoded data when a message arrives.
 * The "To" phone number is used to route to the correct channel.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();

    const payload: TwilioWebhookPayload = {
      MessageSid: formData.get("MessageSid") as string,
      AccountSid: formData.get("AccountSid") as string,
      From: formData.get("From") as string,
      To: formData.get("To") as string,
      Body: formData.get("Body") as string,
      NumMedia: (formData.get("NumMedia") as string) ?? "0",
      MediaUrl0: (formData.get("MediaUrl0") as string) ?? undefined,
      MediaContentType0: (formData.get("MediaContentType0") as string) ?? undefined,
    };

    if (!payload.To || !payload.From) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { "Content-Type": "text/xml" } },
      );
    }

    // Find channel by phone number
    const [channel] = await db
      .select()
      .from(channelSms)
      .where(eq(channelSms.phoneNumber, payload.To))
      .limit(1);

    if (!channel) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { "Content-Type": "text/xml" } },
      );
    }

    // Find the inbox
    const [inbox] = await db
      .select()
      .from(inboxes)
      .where(
        and(
          eq(inboxes.accountId, channel.accountId),
          eq(inboxes.channelId, channel.id),
          eq(inboxes.channelType, "sms"),
        ),
      )
      .limit(1);

    if (!inbox) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { "Content-Type": "text/xml" } },
      );
    }

    await processInboundWebhook(channel.accountId, inbox.id, payload);

    // Twilio expects TwiML response
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { "Content-Type": "text/xml" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Processing error";
    console.error("[SMS Webhook]", message);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { "Content-Type": "text/xml" } },
    );
  }
};
