import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  jsonb,
  smallint,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { users } from "./users";
import { conversations } from "./conversations";

export const kanbanBoards = pgTable("kanban_boards", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const kanbanStages = pgTable("kanban_stages", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id")
    .notNull()
    .references(() => kanbanBoards.id, { onDelete: "cascade" }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#6b7280"),
  position: smallint("position").notNull().default(0),
  // Macro to execute when a ticket enters this stage
  macroActions: jsonb("macro_actions").default([]),
  // Conditions that must be met for the macro to fire
  macroConditions: jsonb("macro_conditions").default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  stageId: integer("stage_id")
    .notNull()
    .references(() => kanbanStages.id),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  priority: smallint("priority").default(0),
  assigneeId: integer("assignee_id").references(() => users.id),
  createdById: integer("created_by_id")
    .notNull()
    .references(() => users.id),
  position: integer("position").notNull().default(0),
  customAttributes: jsonb("custom_attributes").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ticketConversations = pgTable(
  "ticket_conversations",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("ticket_conversations_unique_idx").on(
      table.ticketId,
      table.conversationId,
    ),
  ],
);
