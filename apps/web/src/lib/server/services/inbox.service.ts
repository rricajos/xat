import { db } from "@xat/db";
import {
  inboxes,
  channelWebWidgets,
  channelEmail,
  channelWhatsapp,
  channelTelegram,
  channelApi,
  channelInstagram,
  channelTwitter,
  channelLine,
  channelSms,
  channelSlack,
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

export async function createTelegramInbox(params: {
  accountId: number;
  name: string;
  botToken: string;
}) {
  const [channel] = await db
    .insert(channelTelegram)
    .values({
      accountId: params.accountId,
      botToken: params.botToken,
    })
    .returning();

  const [inbox] = await db
    .insert(inboxes)
    .values({
      accountId: params.accountId,
      name: params.name,
      channelType: "telegram",
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

export async function createInstagramInbox(params: {
  accountId: number;
  name: string;
  pageId: string;
  pageAccessToken: string;
  instagramId?: string;
}) {
  const [channel] = await db
    .insert(channelInstagram)
    .values({
      accountId: params.accountId,
      pageId: params.pageId,
      pageAccessToken: params.pageAccessToken,
      instagramId: params.instagramId,
    })
    .returning();

  const [inbox] = await db
    .insert(inboxes)
    .values({
      accountId: params.accountId,
      name: params.name,
      channelType: "instagram",
      channelId: channel!.id,
    })
    .returning();

  return { inbox: inbox!, channel: channel! };
}

export async function createTwitterInbox(params: {
  accountId: number;
  name: string;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  twitterAccountId?: string;
}) {
  const [channel] = await db
    .insert(channelTwitter)
    .values({
      accountId: params.accountId,
      apiKey: params.apiKey,
      apiSecret: params.apiSecret,
      accessToken: params.accessToken,
      accessTokenSecret: params.accessTokenSecret,
      twitterAccountId: params.twitterAccountId,
    })
    .returning();

  const [inbox] = await db
    .insert(inboxes)
    .values({
      accountId: params.accountId,
      name: params.name,
      channelType: "twitter",
      channelId: channel!.id,
    })
    .returning();

  return { inbox: inbox!, channel: channel! };
}

export async function createLineInbox(params: {
  accountId: number;
  name: string;
  channelAccessToken: string;
  channelSecret: string;
  lineChannelId?: string;
}) {
  const [channel] = await db
    .insert(channelLine)
    .values({
      accountId: params.accountId,
      channelAccessToken: params.channelAccessToken,
      channelSecret: params.channelSecret,
      lineChannelId: params.lineChannelId,
    })
    .returning();

  const [inbox] = await db
    .insert(inboxes)
    .values({
      accountId: params.accountId,
      name: params.name,
      channelType: "line",
      channelId: channel!.id,
    })
    .returning();

  return { inbox: inbox!, channel: channel! };
}

export async function createSmsInbox(params: {
  accountId: number;
  name: string;
  phoneNumber: string;
  accountSid: string;
  authToken: string;
}) {
  const [channel] = await db
    .insert(channelSms)
    .values({
      accountId: params.accountId,
      phoneNumber: params.phoneNumber,
      accountSid: params.accountSid,
      authToken: params.authToken,
    })
    .returning();

  const [inbox] = await db
    .insert(inboxes)
    .values({
      accountId: params.accountId,
      name: params.name,
      channelType: "sms",
      channelId: channel!.id,
    })
    .returning();

  return { inbox: inbox!, channel: channel! };
}

export async function createSlackInbox(params: {
  accountId: number;
  name: string;
  slackTeamId: string;
  slackChannelId: string;
  botToken: string;
  botUserId?: string;
  slackTeamName?: string;
}) {
  const [channel] = await db
    .insert(channelSlack)
    .values({
      accountId: params.accountId,
      slackTeamId: params.slackTeamId,
      slackChannelId: params.slackChannelId,
      botToken: params.botToken,
      botUserId: params.botUserId,
      slackTeamName: params.slackTeamName,
    })
    .returning();

  const [inbox] = await db
    .insert(inboxes)
    .values({
      accountId: params.accountId,
      name: params.name,
      channelType: "slack",
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
