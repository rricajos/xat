import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  smallint,
  boolean,
  jsonb,
  timestamp,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { conversations } from "./conversations";

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderType: varchar("sender_type", { length: 20 }),
    senderId: integer("sender_id"),
    messageType: smallint("message_type").default(0).notNull(),
    contentType: varchar("content_type", { length: 20 }).default("text"),
    content: text("content"),
    contentAttributes: jsonb("content_attributes").default({}),
    private: boolean("private").default(false),
    status: varchar("status", { length: 20 }).default("sent"),
    sourceId: varchar("source_id", { length: 255 }),
    externalSourceIds: jsonb("external_source_ids").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    index("messages_account_conversation_idx").on(
      table.accountId,
      table.conversationId,
    ),
  ],
);

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  messageId: integer("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  fileType: smallint("file_type").default(0),
  externalUrl: text("external_url"),
  fileName: varchar("file_name", { length: 512 }),
  mimeType: varchar("mime_type", { length: 255 }),
  fileSize: integer("file_size"),
  storagePath: text("storage_path"),
  coordinatesLat: decimal("coordinates_lat"),
  coordinatesLong: decimal("coordinates_long"),
  fallbackTitle: varchar("fallback_title", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
