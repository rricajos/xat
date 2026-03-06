import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "@xat/db";
import { channelLine, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { processInboundWebhook, verifySignature } from "$lib/server/channels/line";
import type { LineWebhookPayload } from "$lib/server/channels/line";

/**
 * LINE webhook endpoint.
 *
 * LINE sends POST requests with message events.
 * Signature verification uses the channel secret.
 */
export const POST: RequestHandler = async ({ request }) => {
  const signature = request.headers.get("x-line-signature") ?? "";
  const bodyText = await request.text();

  let payload: LineWebhookPayload;
  try {
    payload = JSON.parse(bodyText) as LineWebhookPayload;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.destination || !payload.events?.length) {
    return json({ ok: true });
  }

  try {
    // Find channel by destination (LINE channel ID)
    const [channel] = await db
      .select()
      .from(channelLine)
      .where(eq(channelLine.lineChannelId, payload.destination))
      .limit(1);

    if (!channel) {
      return json({ ok: true });
    }

    // Verify signature
    if (!verifySignature(bodyText, signature, channel.channelSecret)) {
      return json({ error: "Invalid signature" }, { status: 403 });
    }

    // Find the inbox
    const [inbox] = await db
      .select()
      .from(inboxes)
      .where(
        and(
          eq(inboxes.accountId, channel.accountId),
          eq(inboxes.channelId, channel.id),
          eq(inboxes.channelType, "line"),
        ),
      )
      .limit(1);

    if (!inbox) {
      return json({ ok: true });
    }

    await processInboundWebhook(
      channel.accountId,
      inbox.id,
      channel.channelAccessToken,
      payload.events,
    );

    return json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Processing error";
    console.error("[LINE Webhook]", message);
    return json({ ok: true });
  }
};
