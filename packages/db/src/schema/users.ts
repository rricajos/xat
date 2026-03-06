import {
  pgTable,
  serial,
  varchar,
  text,
  smallint,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  encryptedPassword: varchar("encrypted_password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  availability: smallint("availability").default(0),
  uiSettings: jsonb("ui_settings").default({}),
  type: varchar("type", { length: 20 }).default("user").notNull(),
  calendarUsername: varchar("calendar_username", { length: 50 }).unique(),
  twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
