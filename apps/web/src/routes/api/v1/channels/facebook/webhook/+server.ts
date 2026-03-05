import { json, text } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { env } from "$env/dynamic/private";
import { db } from "@xat/db";
import { channelFacebook, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { getChannelByPageId, processInboundWebhook } from "$lib/server/channels/facebook";

/**
 * Facebook Messenger webhook endpoint.
 *
 * GET: Webhook verification (Facebook sends a challenge during setup)
 * POST: Incoming messages from Messenger
 *
 * Requires FACEBOOK_VERIFY_TOKEN env var for webhook verification.
 */

export const GET: RequestHandler = async ({ url }) => {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = env.FACEBOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return text(challenge);
  }

  return json({ error: "Verification failed" }, { status: 403 });
};

export const POST: RequestHandler = async ({ request }) => {
  const payload = await request.json();

  if (payload.object !== "page") {
    return json({ error: "Not a page event" }, { status: 400 });
  }

  for (const entry of payload.entry) {
    const pageId = entry.id;

    // Find the channel by page ID
    const channel = await getChannelByPageId(pageId);
    if (!channel) continue;

    // Find the inbox linked to this channel
    const [inbox] = await db
      .select()
      .from(inboxes)
      .where(
        and(
          eq(inboxes.accountId, channel.accountId),
          eq(inboxes.channelId, channel.id),
          eq(inboxes.channelType, "Channel::FacebookPage"),
        ),
      )
      .limit(1);

    if (!inbox) continue;

    try {
      await processInboundWebhook(
        channel.accountId,
        inbox.id,
        channel.pageAccessToken,
        entry,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Processing error";
      console.error("[Facebook Webhook]", message);
    }
  }

  return json({ status: "ok" });
};
