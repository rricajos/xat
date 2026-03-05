import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  smallint,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { users } from "./users";

export const accountUsers = pgTable(
  "account_users",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("agent").notNull(),
    autoOffline: boolean("auto_offline").default(true),
    availability: smallint("availability").default(0),
    activeAt: timestamp("active_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("account_users_account_id_user_id_idx").on(
      table.accountId,
      table.userId,
    ),
  ],
);
