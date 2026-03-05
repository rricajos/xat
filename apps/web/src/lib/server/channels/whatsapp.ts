import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
  type BaileysEventMap,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { db } from "@xat/db";
import {
  channelWhatsapp,
  inboxes,
  contacts,
  conversations,
  messages,
  contactInboxes,
} from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { join } from "node:path";
import { mkdirSync } from "node:fs";

interface WhatsAppSession {
  socket: WASocket;
  channelId: number;
  accountId: number;
  inboxId: number;
}

const sessions = new Map<number, WhatsAppSession>();
const qrCallbacks = new Map<number, (qr: string) => void>();
const statusCallbacks = new Map<number, (status: string) => void>();

const AUTH_DIR = join(process.cwd(), ".whatsapp-sessions");

function getAuthPath(channelId: number): string {
  const dir = join(AUTH_DIR, `channel-${channelId}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function onQrCode(channelId: number, cb: (qr: string) => void) {
  qrCallbacks.set(channelId, cb);
}

export function onStatusChange(channelId: number, cb: (status: string) => void) {
  statusCallbacks.set(channelId, cb);
}

export function removeCallbacks(channelId: number) {
  qrCallbacks.delete(channelId);
  statusCallbacks.delete(channelId);
}

export function getSession(channelId: number): WhatsAppSession | undefined {
  return sessions.get(channelId);
}

export function isConnected(channelId: number): boolean {
  const session = sessions.get(channelId);
  return session?.socket?.user !== undefined;
}

export async function startWhatsAppSession(
  channelId: number,
  accountId: number,
  inboxId: number,
): Promise<void> {
  // Don't start duplicate sessions
  if (sessions.has(channelId)) {
    const existing = sessions.get(channelId)!;
    if (existing.socket?.user) return;
    // Close stale socket
    existing.socket?.end(undefined);
    sessions.delete(channelId);
  }

  const authPath = getAuthPath(channelId);
  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ["Xat", "Chrome", "1.0.0"],
  });

  const session: WhatsAppSession = {
    socket,
    channelId,
    accountId,
    inboxId,
  };

  sessions.set(channelId, session);

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const cb = qrCallbacks.get(channelId);
      if (cb) cb(qr);

      await db
        .update(channelWhatsapp)
        .set({ status: "waiting_qr", updatedAt: new Date() })
        .where(eq(channelWhatsapp.id, channelId));

      const scb = statusCallbacks.get(channelId);
      if (scb) scb("waiting_qr");
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      await db
        .update(channelWhatsapp)
        .set({
          status: shouldReconnect ? "disconnected" : "logged_out",
          updatedAt: new Date(),
        })
        .where(eq(channelWhatsapp.id, channelId));

      const scb = statusCallbacks.get(channelId);
      if (scb) scb(shouldReconnect ? "disconnected" : "logged_out");

      sessions.delete(channelId);

      if (shouldReconnect) {
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          startWhatsAppSession(channelId, accountId, inboxId);
        }, 3000);
      }
    }

    if (connection === "open") {
      const phoneNumber = socket.user?.id?.split(":")[0] ?? null;

      await db
        .update(channelWhatsapp)
        .set({
          status: "connected",
          phoneNumber,
          updatedAt: new Date(),
        })
        .where(eq(channelWhatsapp.id, channelId));

      const scb = statusCallbacks.get(channelId);
      if (scb) scb("connected");

      console.log(`[WhatsApp] Channel ${channelId} connected: ${phoneNumber}`);
    }
  });

  // Handle incoming messages
  socket.ev.on("messages.upsert", async (m) => {
    if (m.type !== "notify") return;

    for (const msg of m.messages) {
      if (msg.key.fromMe) continue;
      if (!msg.message) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid === "status@broadcast") continue;

      const senderPhone = remoteJid.split("@")[0] ?? remoteJid;
      const pushName = msg.pushName ?? senderPhone;

      const textContent =
        msg.message.conversation ??
        msg.message.extendedTextMessage?.text ??
        msg.message.imageMessage?.caption ??
        msg.message.videoMessage?.caption ??
        "[media]";

      try {
        await handleIncomingWhatsAppMessage({
          accountId,
          inboxId,
          senderPhone,
          senderName: pushName,
          content: textContent,
          messageId: msg.key.id ?? undefined,
        });
      } catch (err) {
        console.error(`[WhatsApp] Error handling message:`, err);
      }
    }
  });
}

async function handleIncomingWhatsAppMessage(params: {
  accountId: number;
  inboxId: number;
  senderPhone: string;
  senderName: string;
  content: string;
  messageId?: string;
}) {
  const { accountId, inboxId, senderPhone, senderName, content } = params;

  // Find or create contact by phone
  let [contact] = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.accountId, accountId),
        eq(contacts.phoneNumber, senderPhone),
      ),
    )
    .limit(1);

  if (!contact) {
    [contact] = await db
      .insert(contacts)
      .values({
        accountId,
        name: senderName,
        phoneNumber: senderPhone,
        identifier: `whatsapp:${senderPhone}`,
      })
      .returning();
  }

  // Find or create contact_inbox link
  let [contactInbox] = await db
    .select()
    .from(contactInboxes)
    .where(
      and(
        eq(contactInboxes.contactId, contact!.id),
        eq(contactInboxes.inboxId, inboxId),
      ),
    )
    .limit(1);

  if (!contactInbox) {
    [contactInbox] = await db
      .insert(contactInboxes)
      .values({
        contactId: contact!.id,
        inboxId,
        accountId,
        sourceId: `whatsapp:${senderPhone}`,
      })
      .returning();
  }

  // Find open conversation or create new one
  let [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.accountId, accountId),
        eq(conversations.contactId, contact!.id),
        eq(conversations.inboxId, inboxId),
        eq(conversations.status, 0), // open
      ),
    )
    .limit(1);

  if (!conversation) {
    // Get next display ID
    const { sql: sqlTag } = await import("drizzle-orm");
    const [maxResult] = await db
      .select({ maxId: sqlTag<number>`COALESCE(MAX(${conversations.displayId}), 0)` })
      .from(conversations)
      .where(eq(conversations.accountId, accountId));

    const displayId = (maxResult?.maxId ?? 0) + 1;

    [conversation] = await db
      .insert(conversations)
      .values({
        accountId,
        inboxId,
        contactId: contact!.id,
        displayId,
        status: 0,
      })
      .returning();
  }

  // Create message
  await db.insert(messages).values({
    accountId,
    conversationId: conversation!.id,
    content,
    messageType: 0, // incoming
    senderType: "Contact",
    senderId: contact!.id,
    sourceId: params.messageId ?? null,
  });

  // Update conversation activity
  await db
    .update(conversations)
    .set({ lastActivityAt: new Date(), updatedAt: new Date() })
    .where(eq(conversations.id, conversation!.id));
}

export async function sendWhatsAppMessage(
  channelId: number,
  phone: string,
  text: string,
): Promise<boolean> {
  const session = sessions.get(channelId);
  if (!session?.socket?.user) return false;

  const jid = `${phone}@s.whatsapp.net`;
  await session.socket.sendMessage(jid, { text });
  return true;
}

export async function disconnectWhatsApp(channelId: number): Promise<void> {
  const session = sessions.get(channelId);
  if (session) {
    session.socket.logout();
    sessions.delete(channelId);
  }

  await db
    .update(channelWhatsapp)
    .set({ status: "disconnected", updatedAt: new Date() })
    .where(eq(channelWhatsapp.id, channelId));
}
