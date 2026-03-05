import {
  pgTable,
  serial,
  integer,
  smallint,
  boolean,
  text,
  jsonb,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { accounts } from "./accounts";
import { inboxes } from "./inboxes";
import { contacts } from "./contacts";
import { users } from "./users";

export const conversations = pgTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    inboxId: integer("inbox_id")
      .notNull()
      .references(() => inboxes.id),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id),
    assigneeId: integer("assignee_id").references(() => users.id),
    teamId: integer("team_id"),
    displayId: integer("display_id").notNull(),
    status: smallint("status").default(0).notNull(),
    priority: smallint("priority").default(0),
    muted: boolean("muted").default(false),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    additionalAttributes: jsonb("additional_attributes").default({}),
    customAttributes: jsonb("custom_attributes").default({}),
    firstReplyCreatedAt: timestamp("first_reply_created_at", {
      withTimezone: true,
    }),
    waitingSince: timestamp("waiting_since", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    uuid: uuid("uuid")
      .default(sql`gen_random_uuid()`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("conversations_account_status_idx").on(
      table.accountId,
      table.status,
    ),
    index("conversations_account_inbox_idx").on(
      table.accountId,
      table.inboxId,
    ),
    index("conversations_account_assignee_idx").on(
      table.accountId,
      table.assigneeId,
    ),
    index("conversations_account_display_id_idx").on(
      table.accountId,
      table.displayId,
    ),
  ],
);
