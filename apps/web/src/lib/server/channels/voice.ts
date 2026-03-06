import { db } from "@xat/db";
import { inboxes, contacts, conversations } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { createConversation, createMessage } from "../services/conversation.service";

/**
 * Voice/Call channel handler.
 *
 * Integrates with Twilio Voice (or similar providers) for:
 * - Inbound call handling (IVR + routing to agents)
 * - Outbound calls from conversations
 * - Call recording and transcription
 * - Voicemail handling
 */

interface InboundCallEvent {
  callSid: string;
  from: string;
  to: string;
  direction: "inbound" | "outbound";
  status: "ringing" | "in-progress" | "completed" | "failed" | "no-answer" | "busy";
  duration?: number;
  recordingUrl?: string;
  transcription?: string;
}

export async function processInboundCall(
  accountId: number,
  inboxId: number,
  call: InboundCallEvent,
) {
  // Find or create contact from phone number
  const existingContacts = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.accountId, accountId),
        eq(contacts.phoneNumber, call.from),
      ),
    )
    .limit(1);

  let contact = existingContacts[0];

  if (!contact) {
    const [newContact] = await db
      .insert(contacts)
      .values({
        accountId,
        name: call.from,
        phoneNumber: call.from,
      })
      .returning();
    contact = newContact!;
  }

  // Create conversation for the call
  const conversation = await createConversation({
    accountId,
    inboxId,
    contactId: contact.id,
    status: 0,
  });

  // Create initial message with call info
  const callInfo = [
    `Incoming call from ${call.from}`,
    call.duration ? `Duration: ${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : "",
    call.status ? `Status: ${call.status}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const message = await createMessage({
    accountId,
    conversationId: conversation!.id,
    content: callInfo,
    messageType: 0, // incoming
    contentType: "call",
    senderType: "Contact",
    senderId: contact.id,
  });

  return { conversation, message, contact };
}

export async function processCallStatusUpdate(
  accountId: number,
  conversationId: number,
  call: InboundCallEvent,
) {
  const parts: string[] = [];

  if (call.status === "completed") {
    parts.push(`Call completed`);
    if (call.duration) {
      parts.push(`Duration: ${Math.floor(call.duration / 60)}m ${call.duration % 60}s`);
    }
  } else if (call.status === "no-answer") {
    parts.push("Missed call");
  } else if (call.status === "busy") {
    parts.push("Call - line busy");
  } else {
    parts.push(`Call status: ${call.status}`);
  }

  if (call.recordingUrl) {
    parts.push(`Recording: ${call.recordingUrl}`);
  }

  if (call.transcription) {
    parts.push(`\nTranscription:\n${call.transcription}`);
  }

  const content = parts.join("\n");

  await createMessage({
    accountId,
    conversationId,
    content,
    messageType: 2, // activity
    contentType: "call",
    senderType: "System",
    senderId: null,
  });
}

/**
 * Generate TwiML for inbound call routing.
 * Returns XML that Twilio uses to handle the call.
 */
export function generateInboundTwiml(params: {
  greetingMessage?: string;
  queueName?: string;
  recordCall?: boolean;
}): string {
  const greeting =
    params.greetingMessage ?? "Thank you for calling. Please wait while we connect you.";
  const queue = params.queueName ?? "support";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${escapeXml(greeting)}</Say>
  ${params.recordCall ? '<Record timeout="30" transcribe="true" />' : ""}
  <Enqueue>${escapeXml(queue)}</Enqueue>
</Response>`;
}

/**
 * Generate TwiML for outbound calls.
 */
export function generateOutboundTwiml(params: {
  to: string;
  callerId: string;
  recordCall?: boolean;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${params.recordCall ? '<Record timeout="30" transcribe="true" />' : ""}
  <Dial callerId="${escapeXml(params.callerId)}">
    <Number>${escapeXml(params.to)}</Number>
  </Dial>
</Response>`;
}

/**
 * Initiate an outbound call via Twilio API.
 */
export async function initiateOutboundCall(params: {
  twilioAccountSid: string;
  twilioAuthToken: string;
  from: string;
  to: string;
  statusCallbackUrl: string;
}): Promise<{ callSid: string } | null> {
  const auth = Buffer.from(
    `${params.twilioAccountSid}:${params.twilioAuthToken}`,
  ).toString("base64");

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${params.twilioAccountSid}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: params.from,
          To: params.to,
          Twiml: generateOutboundTwiml({
            to: params.to,
            callerId: params.from,
            recordCall: true,
          }),
          StatusCallback: params.statusCallbackUrl,
          StatusCallbackEvent: "initiated ringing answered completed",
        }),
      },
    );

    if (!response.ok) return null;

    const result = (await response.json()) as { sid: string };
    return { callSid: result.sid };
  } catch {
    return null;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
