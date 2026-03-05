import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "@xat/db";
import { channelTelegram, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { processInboundUpdate } from "$lib/server/channels/telegram";

/**
 * Telegram webhook endpoint.
 *
 * Telegram sends POST requests here when a message is received.
 * The bot token is included as a query parameter for routing.
 *
 * URL format: /api/v1/channels/telegram/webhook?token=BOT_TOKEN
 */
export const POST: RequestHandler = async ({ request, url }) => {
  const token = url.searchParams.get("token");
  if (!token) {
    return json({ error: "Missing token" }, { status: 400 });
  }

  // Find the channel by bot token
  const [channel] = await db
    .select()
    .from(channelTelegram)
    .where(eq(channelTelegram.botToken, token))
    .limit(1);

  if (!channel) {
    return json({ error: "Unknown bot token" }, { status: 404 });
  }

  // Find the inbox linked to this channel
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(
      and(
        eq(inboxes.accountId, channel.accountId),
        eq(inboxes.channelId, channel.id),
        eq(inboxes.channelType, "Channel::Telegram"),
      ),
    )
    .limit(1);

  if (!inbox) {
    return json({ error: "No inbox configured for this channel" }, { status: 404 });
  }

  try {
    const update = await request.json();
    await processInboundUpdate(channel.accountId, inbox.id, update);
    return json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Processing error";
    console.error("[Telegram Webhook]", message);
    return json({ ok: true }); // Always return 200 to Telegram to prevent retries
  }
};

// Telegram also sends GET requests during webhook verification
export const GET: RequestHandler = async () => {
  return json({ status: "ok" });
};
