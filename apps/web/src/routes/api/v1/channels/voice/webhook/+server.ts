import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "@xat/db";
import { inboxes, channelSms } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import {
  processInboundCall,
  processCallStatusUpdate,
  generateInboundTwiml,
} from "$lib/server/channels/voice";

/**
 * Twilio Voice webhook handler.
 * Receives call events from Twilio and processes them.
 */
export const POST: RequestHandler = async (event) => {
  const formData = await event.request.formData();

  const callSid = formData.get("CallSid") as string | null;
  const from = formData.get("From") as string | null;
  const to = formData.get("To") as string | null;
  const callStatus = formData.get("CallStatus") as string | null;
  const direction = formData.get("Direction") as string | null;
  const duration = formData.get("CallDuration") as string | null;
  const recordingUrl = formData.get("RecordingUrl") as string | null;

  if (!callSid || !from || !to) {
    return json({ error: "Missing required call parameters" }, { status: 400 });
  }

  // Find inbox by the phone number being called
  const phoneNumber = to.replace(/^\+/, "");
  const smsChannels = await db
    .select({ id: channelSms.id, accountId: channelSms.accountId })
    .from(channelSms)
    .where(eq(channelSms.phoneNumber, phoneNumber));

  if (smsChannels.length === 0) {
    // Return a basic TwiML response even if no inbox matches
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, this number is not configured.</Say></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  const smsChannel = smsChannels[0]!;

  // Find inbox
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(
      and(
        eq(inboxes.channelId, smsChannel.id),
        eq(inboxes.accountId, smsChannel.accountId),
      ),
    )
    .limit(1);

  if (!inbox) {
    return new Response(
      generateInboundTwiml({}),
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  // Initial call — return TwiML
  if (callStatus === "ringing" || !callStatus) {
    const settings = (inbox.settings ?? {}) as Record<string, unknown>;

    await processInboundCall(smsChannel.accountId, inbox.id, {
      callSid,
      from,
      to,
      direction: (direction as "inbound" | "outbound") ?? "inbound",
      status: "ringing",
    });

    return new Response(
      generateInboundTwiml({
        greetingMessage: settings.voiceGreeting as string | undefined,
        recordCall: settings.recordCalls as boolean | undefined,
      }),
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  // Status update (completed, no-answer, busy, etc.)
  // TODO: look up conversation by callSid for status updates

  return json({ ok: true });
};
