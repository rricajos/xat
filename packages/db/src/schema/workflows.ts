import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";

export const conversationWorkflows = pgTable(
  "conversation_workflows",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    enabled: boolean("enabled").default(true),
    triggerAction: varchar("trigger_action", { length: 50 }).notNull(), // 'resolve', 'pending', 'handoff'
    requiredAttributes: jsonb("required_attributes").default([]),
    // [{attributeKey: string, attributeType: 'conversation' | 'contact', required: boolean}]
    validationMessage: text("validation_message"),
    inboxIds: jsonb("inbox_ids").default([]), // empty = apply to all inboxes
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("conv_workflows_account_idx").on(table.accountId),
  ],
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("push_subs_user_idx").on(table.userId),
  ],
);

export const channelSlack = pgTable("channel_slack", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  slackTeamId: varchar("slack_team_id", { length: 255 }).notNull(),
  slackChannelId: varchar("slack_channel_id", { length: 255 }).notNull(),
  botToken: text("bot_token").notNull(),
  botUserId: varchar("bot_user_id", { length: 255 }),
  slackTeamName: varchar("slack_team_name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
