import { db } from "@xat/db";
import {
  inboxes,
  channelWebWidgets,
  channelEmail,
  channelWhatsapp,
  channelApi,
} from "@xat/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "node:crypto";

export async function listInboxes(accountId: number) {
  return db
    .select()
    .from(inboxes)
    .where(eq(inboxes.accountId, accountId))
    .orderBy(inboxes.name);
}

export async function getInbox(accountId: number, inboxId: number) {
  const [inbox] = await db
    .select()
    .from(inboxes)
    .where(and(eq(inboxes.id, inboxId), eq(inboxes.accountId, accountId)))
    .limit(1);

  return inbox ?? null;
}

export async function createWebWidgetInbox(params: {
  accountId: number;
  name: string;
  websiteUrl?: string;
  welcomeTitle?: string;
  welcomeTagline?: string;
  widgetColor?: string;
}) {
  const websiteToken = randomBytes(16).toString("hex");

  // Create channel
  const [channel] = await db
    .insert(channelWebWidgets)
    .values({
      accountId: params.accountId,
      websiteToken,
      websiteUrl: params.websiteUrl,
      welcomeTitle: params.welcomeTitle,
      welcomeTagline: params.welcomeTagline,
      widgetColor: params.widgetColor,
    })
    .returning();

  // Create inbox
  const [inbox] = await db
    .insert(inboxes)
    .values({
      accountId: params.accountId,
      name: params.name,
      channelType: "web_widget",
      channelId: channel!.id,
    })
    .returning();

  return { inbox: inbox!, channel: channel! };
}

export async function createEmailInbox(params: {
  accountId: number;
  name: string;
  email: string;
  imapEnabled?: boolean;
  imapAddress?: string;
  imapPort?: number;
  imapLogin?: string;
  imapPassword?: string;
  smtpEnabled?: boolean;
  smtpAddress?: string;
  smtpPort?: number;
  smtpLogin?: string;
  smtpPassword?: string;
}) {
  const [channel] = await db
    .insert(channelEmail)
    .values({
      accountId: params.accountId,
      email: params.email,
      imapEnabled: params.imapEnabled ?? false,
      imapAddress: params.imapAddress,
      imapPort: params.imapPort,
      imapLogin: params.imapLogin,
      imapPassword: params.imapPassword,
      smtpEnabled: params.smtpEnabled ?? false,
      smtpAddress: params.smtpAddress,
      smtpPort: params.smtpPort,
      smtpLogin: params.smtpLogin,
      smtpPassword: params.smtpPassword,
    })
    .returning();

  const [inbox] = await db
    .insert(inboxes)
    .values({
      accountId: params.accountId,
      name: params.name,
      channelType: "email",
      channelId: channel!.id,
    })
    .returning();

  return { inbox: inbox!, channel: channel! };
}

export async function createWhatsAppInbox(params: {
  accountId: number;
  name: string;
  providerType?: string;
}) {
  const [channel] = await db
    .insert(channelWhatsapp)
    .values({
      accountId: params.accountId,
      providerType: params.providerType ?? "baileys",
      status: "disconnected",
    })
    .returning();

  const [inbox] = await db
    .insert(inboxes)
    .values({
      accountId: params.accountId,
      name: params.name,
      channelType: "whatsapp",
      channelId: channel!.id,
    })
    .returning();

  return { inbox: inbox!, channel: channel! };
}

export async function createApiInbox(params: {
  accountId: number;
  name: string;
  webhookUrl?: string;
}) {
  const hmacToken = randomBytes(32).toString("hex");

  const [channel] = await db
    .insert(channelApi)
    .values({
      accountId: params.accountId,
      webhookUrl: params.webhookUrl,
      hmacToken,
    })
    .returning();

  const [inbox] = await db
    .insert(inboxes)
    .values({
      accountId: params.accountId,
      name: params.name,
      channelType: "api",
      channelId: channel!.id,
    })
    .returning();

  return { inbox: inbox!, channel: channel! };
}

export async function deleteInbox(accountId: number, inboxId: number) {
  await db
    .delete(inboxes)
    .where(and(eq(inboxes.id, inboxId), eq(inboxes.accountId, accountId)));
}
