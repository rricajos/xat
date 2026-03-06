import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "@xat/db";
import { channelTwitter, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { processInboundWebhook } from "$lib/server/channels/twitter";
import type { TwitterWebhookPayload } from "$lib/server/channels/twitter";
import { createHmac } from "node:crypto";

/**
 * Twitter/X Account Activity API webhook endpoint.
 *
 * Twitter sends POST requests for DM events.
 * Also handles CRC (Challenge-Response Check) via GET.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const payload = (await request.json()) as TwitterWebhookPayload;

    if (!payload.for_user_id || !payload.direct_message_events?.length) {
      return json({ ok: true });
    }

    // Find channel by Twitter account ID
    const [channel] = await db
      .select()
      .from(channelTwitter)
      .where(eq(channelTwitter.twitterAccountId, payload.for_user_id))
      .limit(1);

    if (!channel) {
      return json({ ok: true });
    }

    // Find the inbox
    const [inbox] = await db
      .select()
      .from(inboxes)
      .where(
        and(
          eq(inboxes.accountId, channel.accountId),
          eq(inboxes.channelId, channel.id),
          eq(inboxes.channelType, "twitter"),
        ),
      )
      .limit(1);

    if (!inbox) {
      return json({ ok: true });
    }

    await processInboundWebhook(channel.accountId, inbox.id, payload);

    return json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Processing error";
    console.error("[Twitter Webhook]", message);
    return json({ ok: true });
  }
};

// CRC (Challenge-Response Check) for webhook registration
export const GET: RequestHandler = async ({ url }) => {
  const crcToken = url.searchParams.get("crc_token");
  const consumerSecret = url.searchParams.get("consumer_secret");

  if (!crcToken) {
    return json({ error: "Missing crc_token" }, { status: 400 });
  }

  // In production, get this from the channel record or env
  const secret = consumerSecret ?? "your_consumer_secret";
  const hash = createHmac("sha256", secret).update(crcToken).digest("base64");

  return json({ response_token: `sha256=${hash}` });
};
