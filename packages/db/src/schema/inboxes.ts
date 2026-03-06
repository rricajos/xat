import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";

export const inboxes = pgTable("inboxes", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  channelType: varchar("channel_type", { length: 50 }).notNull(),
  channelId: integer("channel_id"),
  greetingEnabled: boolean("greeting_enabled").default(false),
  greetingMessage: text("greeting_message"),
  enableAutoAssignment: boolean("enable_auto_assignment").default(true),
  enableEmailCollect: boolean("enable_email_collect").default(true),
  csatSurveyEnabled: boolean("csat_survey_enabled").default(false),
  allowMessagesAfterResolved: boolean("allow_messages_after_resolved").default(
    true,
  ),
  businessHoursEnabled: boolean("business_hours_enabled").default(false),
  outOfOfficeMessage: text("out_of_office_message"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const channelWebWidgets = pgTable("channel_web_widgets", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  websiteToken: varchar("website_token", { length: 255 }).notNull().unique(),
  websiteUrl: text("website_url"),
  welcomeTitle: varchar("welcome_title", { length: 255 }),
  welcomeTagline: varchar("welcome_tagline", { length: 255 }),
  widgetColor: varchar("widget_color", { length: 7 }).default("#1f93ff"),
  replyTime: varchar("reply_time", { length: 20 }).default(
    "in_a_few_minutes",
  ),
  preChatFormEnabled: boolean("pre_chat_form_enabled").default(false),
  preChatFormOptions: jsonb("pre_chat_form_options").default({}),
  hmacToken: varchar("hmac_token", { length: 255 }),
  hmacMandatory: boolean("hmac_mandatory").default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const channelEmail = pgTable("channel_email", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  forwardToEmail: varchar("forward_to_email", { length: 255 }),
  imapEnabled: boolean("imap_enabled").default(false),
  imapAddress: varchar("imap_address", { length: 255 }),
  imapPort: integer("imap_port"),
  imapLogin: varchar("imap_login", { length: 255 }),
  imapPassword: varchar("imap_password", { length: 255 }),
  imapEnableSsl: boolean("imap_enable_ssl").default(true),
  smtpEnabled: boolean("smtp_enabled").default(false),
  smtpAddress: varchar("smtp_address", { length: 255 }),
  smtpPort: integer("smtp_port"),
  smtpLogin: varchar("smtp_login", { length: 255 }),
  smtpPassword: varchar("smtp_password", { length: 255 }),
  smtpEnableSslTls: boolean("smtp_enable_ssl_tls").default(true),
  emailSignature: text("email_signature"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const channelWhatsapp = pgTable("channel_whatsapp", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  providerType: varchar("provider_type", { length: 20 })
    .default("baileys")
    .notNull(),
  status: varchar("status", { length: 20 }).default("disconnected").notNull(),
  sessionData: jsonb("session_data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const channelTelegram = pgTable("channel_telegram", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  botToken: varchar("bot_token", { length: 255 }).notNull(),
  botUsername: varchar("bot_username", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const channelFacebook = pgTable("channel_facebook", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  pageId: varchar("page_id", { length: 255 }).notNull(),
  pageAccessToken: text("page_access_token").notNull(),
  userAccessToken: text("user_access_token"),
  pageName: varchar("page_name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const channelApi = pgTable("channel_api", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  webhookUrl: text("webhook_url"),
  hmacToken: varchar("hmac_token", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const channelInstagram = pgTable("channel_instagram", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  pageId: varchar("page_id", { length: 255 }).notNull(),
  pageAccessToken: text("page_access_token").notNull(),
  instagramId: varchar("instagram_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const channelTwitter = pgTable("channel_twitter", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  apiSecret: varchar("api_secret", { length: 255 }).notNull(),
  accessToken: text("access_token").notNull(),
  accessTokenSecret: text("access_token_secret").notNull(),
  twitterAccountId: varchar("twitter_account_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const channelLine = pgTable("channel_line", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  channelAccessToken: text("channel_access_token").notNull(),
  channelSecret: varchar("channel_secret", { length: 255 }).notNull(),
  lineChannelId: varchar("line_channel_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const channelSms = pgTable("channel_sms", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  providerType: varchar("provider_type", { length: 20 })
    .default("twilio")
    .notNull(),
  accountSid: varchar("account_sid", { length: 255 }).notNull(),
  authToken: varchar("auth_token", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
