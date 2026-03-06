import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "@xat/db";
import { channelInstagram, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { processInboundWebhook } from "$lib/server/channels/instagram";
import type { InstagramWebhookPayload } from "$lib/server/channels/instagram";
import { env } from "$env/dynamic/private";

/**
 * Instagram webhook endpoint.
 *
 * Facebook sends POST requests here for Instagram messaging events.
 * Uses the same Graph API webhook verification as Facebook Messenger.
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const payload = (await request.json()) as InstagramWebhookPayload;

    if (payload.object !== "instagram") {
      return json({ error: "Not an Instagram event" }, { status: 400 });
    }

    for (const entry of payload.entry) {
      if (!entry.messaging?.length) continue;

      // The recipient ID should match our Instagram account
      const recipientId = entry.messaging[0]?.recipient?.id;
      if (!recipientId) continue;

      // Find channel by Instagram ID
      const [channel] = await db
        .select()
        .from(channelInstagram)
        .where(eq(channelInstagram.instagramId, recipientId))
        .limit(1);

      if (!channel) continue;

      // Find the inbox
      const [inbox] = await db
        .select()
        .from(inboxes)
        .where(
          and(
            eq(inboxes.accountId, channel.accountId),
            eq(inboxes.channelId, channel.id),
            eq(inboxes.channelType, "instagram"),
          ),
        )
        .limit(1);

      if (!inbox) continue;

      await processInboundWebhook(
        channel.accountId,
        inbox.id,
        channel.pageAccessToken,
        entry,
      );
    }

    return json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Processing error";
    console.error("[Instagram Webhook]", message);
    return json({ ok: true }); // Always 200 to prevent retries
  }
};

// Webhook verification (shared with Facebook)
export const GET: RequestHandler = async ({ url }) => {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = env.FACEBOOK_VERIFY_TOKEN ?? "xat_verify_token";

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return json({ error: "Verification failed" }, { status: 403 });
};
