import type { RequestHandler } from "./$types";
import { requireAdmin } from "$lib/server/api-auth";
import {
  startWhatsAppSession,
  onQrCode,
  onStatusChange,
  removeCallbacks,
} from "$lib/server/channels/whatsapp";
import { db } from "@xat/db";
import { channelWhatsapp, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";

// SSE endpoint — streams QR codes and status updates for a channel
export const GET: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const channelId = parseInt(event.url.searchParams.get("channelId") ?? "0");

  if (!channelId) {
    return new Response("channelId required", { status: 400 });
  }

  // Verify channel belongs to account
  const [channel] = await db
    .select()
    .from(channelWhatsapp)
    .where(
      and(
        eq(channelWhatsapp.id, channelId),
        eq(channelWhatsapp.accountId, account.id),
      ),
    )
    .limit(1);

  if (!channel) {
    return new Response("Channel not found", { status: 404 });
  }

  // Find associated inbox
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(
      and(
        eq(inboxes.channelId, channelId),
        eq(inboxes.channelType, "Channel::Whatsapp"),
        eq(inboxes.accountId, account.id),
      ),
    )
    .limit(1);

  if (!inbox) {
    return new Response("Inbox not found", { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(eventName: string, data: string) {
        controller.enqueue(
          encoder.encode(`event: ${eventName}\ndata: ${data}\n\n`),
        );
      }

      onQrCode(channelId, (qr) => {
        send("qr", JSON.stringify({ qr }));
      });

      onStatusChange(channelId, (status) => {
        send("status", JSON.stringify({ status }));
        if (status === "connected") {
          controller.close();
          removeCallbacks(channelId);
        }
      });

      // Start/restart the session
      startWhatsAppSession(channelId, account.id, inbox.id);

      // Send initial status
      send("status", JSON.stringify({ status: channel.status }));
    },
    cancel() {
      removeCallbacks(channelId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
