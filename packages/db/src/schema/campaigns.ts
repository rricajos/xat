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
import { inboxes } from "./inboxes";

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  message: text("message").notNull(),
  campaignType: varchar("campaign_type", { length: 20 }).notNull(),
  inboxId: integer("inbox_id").references(() => inboxes.id),
  audience: jsonb("audience").default([]),
  triggerRules: jsonb("trigger_rules").default({}),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  enabled: boolean("enabled").default(true),
  campaignStatus: varchar("campaign_status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
