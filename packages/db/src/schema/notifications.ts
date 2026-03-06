import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { users } from "./users";

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: varchar("notification_type", { length: 50 }).notNull(),
    primaryActorType: varchar("primary_actor_type", { length: 50 }),
    primaryActorId: integer("primary_actor_id"),
    secondaryActorType: varchar("secondary_actor_type", { length: 50 }),
    secondaryActorId: integer("secondary_actor_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_user_read_idx").on(
      table.accountId,
      table.userId,
      table.readAt,
    ),
  ],
);

// Per-agent notification preferences (which events trigger which channels)
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: varchar("notification_type", { length: 50 }).notNull(),
    emailEnabled: boolean("email_enabled").default(true).notNull(),
    pushEnabled: boolean("push_enabled").default(true).notNull(),
    webEnabled: boolean("web_enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("notification_prefs_unique_idx").on(
      table.userId,
      table.notificationType,
    ),
  ],
);
