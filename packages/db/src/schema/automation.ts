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
import { users } from "./users";

export const automationRules = pgTable("automation_rules", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  eventName: varchar("event_name", { length: 50 }).notNull(),
  conditions: jsonb("conditions").default([]).notNull(),
  actions: jsonb("actions").default([]).notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const macros = pgTable("macros", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  visibility: varchar("visibility", { length: 20 }).default("personal"),
  createdById: integer("created_by_id")
    .notNull()
    .references(() => users.id),
  actions: jsonb("actions").default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const slaPolicies = pgTable("sla_policies", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  firstResponseTimeThreshold: integer("first_response_time_threshold"),
  nextResponseTimeThreshold: integer("next_response_time_threshold"),
  resolutionTimeThreshold: integer("resolution_time_threshold"),
  onlyDuringBusinessHours: boolean("only_during_business_hours").default(
    false,
  ),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appliedSlas = pgTable("applied_slas", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  slaPolicyId: integer("sla_policy_id")
    .notNull()
    .references(() => slaPolicies.id, { onDelete: "cascade" }),
  conversationId: integer("conversation_id").notNull(),
  slaStatus: varchar("sla_status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
