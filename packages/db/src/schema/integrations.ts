import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { users } from "./users";

export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  subscriptions: jsonb("subscriptions").default([]),
  enabled: boolean("enabled").default(true),
  hmacToken: varchar("hmac_token", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  appId: varchar("app_id", { length: 255 }).notNull(),
  settings: jsonb("settings").default({}),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const apiTokens = pgTable(
  "api_tokens",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("api_tokens_token_idx").on(table.token),
    index("api_tokens_account_user_idx").on(table.accountId, table.userId),
  ],
);

export const videoCalls = pgTable(
  "video_calls",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    conversationId: integer("conversation_id").notNull(),
    roomName: varchar("room_name", { length: 255 }).notNull(),
    roomId: varchar("room_id", { length: 255 }),
    provider: varchar("provider", { length: 50 }).default("dyte").notNull(),
    status: varchar("status", { length: 20 }).default("created").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    initiatedById: integer("initiated_by_id").references(() => users.id),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("video_calls_conversation_idx").on(table.conversationId),
    index("video_calls_room_idx").on(table.roomId),
  ],
);

export const agentBots = pgTable("agent_bots", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  outgoingUrl: text("outgoing_url"),
  accessToken: varchar("access_token", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const dashboardApps = pgTable("dashboard_apps", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: jsonb("content").default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
