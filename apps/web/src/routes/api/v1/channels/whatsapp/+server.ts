import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAdmin, errorResponse } from "$lib/server/api-auth";
import { db } from "@xat/db";
import { channelWhatsapp, inboxes } from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import {
  startWhatsAppSession,
  onQrCode,
  onStatusChange,
  removeCallbacks,
  isConnected,
  disconnectWhatsApp,
} from "$lib/server/channels/whatsapp";

// GET — list WhatsApp channels for this account
export const GET: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);

  const channels = await db
    .select()
    .from(channelWhatsapp)
    .where(eq(channelWhatsapp.accountId, account.id));

  return json({ data: channels });
};

// POST — create a new WhatsApp inbox + channel and start pairing
export const POST: RequestHandler = async (event) => {
  const { account } = requireAdmin(event);
  const body = await event.request.json();
  const name = body.name?.trim() || "WhatsApp";

  // Create channel record
  const [channel] = await db
    .insert(channelWhatsapp)
    .values({
      accountId: account.id,
      providerType: "baileys",
      status: "disconnected",
    })
    .returning();

  // Create inbox linked to this channel
  const [inbox] = await db
    .insert(inboxes)
    .values({
      accountId: account.id,
      name,
      channelType: "Channel::Whatsapp",
      channelId: channel!.id,
    })
    .returning();

  // Start session — QR will be emitted via SSE
  await startWhatsAppSession(channel!.id, account.id, inbox!.id);

  return json(
    { data: { channel: channel!, inbox: inbox! } },
    { status: 201 },
  );
};
