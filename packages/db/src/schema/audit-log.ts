import {
  pgTable,
  serial,
  integer,
  varchar,
  jsonb,
  timestamp,
  text,
  index,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { users } from "./users";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    auditableType: varchar("auditable_type", { length: 50 }),
    auditableId: integer("auditable_id"),
    changes: jsonb("changes").default({}),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_account_created_idx").on(
      table.accountId,
      table.createdAt,
    ),
    index("audit_logs_auditable_idx").on(
      table.auditableType,
      table.auditableId,
    ),
  ],
);
