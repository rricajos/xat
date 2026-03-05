import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { contacts } from "./contacts";
import { inboxes } from "./inboxes";

export const contactInboxes = pgTable(
  "contact_inboxes",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    inboxId: integer("inbox_id")
      .notNull()
      .references(() => inboxes.id, { onDelete: "cascade" }),
    sourceId: varchar("source_id", { length: 255 }),
    hmacVerified: boolean("hmac_verified").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("contact_inboxes_unique_idx").on(
      table.contactId,
      table.inboxId,
      table.sourceId,
    ),
  ],
);
