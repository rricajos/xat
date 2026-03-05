import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  description: text("description"),
  customAttributes: jsonb("custom_attributes").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 50 }),
    avatarUrl: text("avatar_url"),
    identifier: varchar("identifier", { length: 255 }),
    additionalAttributes: jsonb("additional_attributes").default({}),
    customAttributes: jsonb("custom_attributes").default({}),
    companyId: integer("company_id").references(() => companies.id),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("contacts_account_email_idx")
      .on(table.accountId, table.email),
    uniqueIndex("contacts_account_identifier_idx")
      .on(table.accountId, table.identifier),
    uniqueIndex("contacts_account_phone_idx")
      .on(table.accountId, table.phoneNumber),
  ],
);
