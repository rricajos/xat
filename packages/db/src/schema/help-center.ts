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

export const portals = pgTable("portals", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  customDomain: varchar("custom_domain", { length: 255 }),
  color: varchar("color", { length: 7 }).default("#1f93ff"),
  headerText: text("header_text"),
  pageTitle: varchar("page_title", { length: 255 }),
  archived: boolean("archived").default(false),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  portalId: integer("portal_id")
    .notNull()
    .references(() => portals.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  position: integer("position").default(0),
  locale: varchar("locale", { length: 10 }).default("en"),
  parentCategoryId: integer("parent_category_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  portalId: integer("portal_id")
    .notNull()
    .references(() => portals.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id),
  authorId: integer("author_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  content: text("content"),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("draft"),
  views: integer("views").default(0),
  position: integer("position").default(0),
  meta: jsonb("meta").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
