import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { accounts } from "./accounts";
import { users } from "./users";
import { teams } from "./teams";
import { inboxes } from "./inboxes";
import { contacts } from "./contacts";

// ─── Event Types ──────────────────────────────────────────────────────────────
// scope USER   → belongs to one agent, booked via /username/slug
// scope TEAM   → belongs to one team,  booked via /team/teamSlug/slug
// scope GLOBAL → account-wide,         booked via /event/slug

export const calendarEventTypes = pgTable(
  "calendar_event_types",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    teamId: integer("team_id").references(() => teams.id, {
      onDelete: "cascade",
    }),
    scope: varchar("scope", { length: 10 }).notNull().default("USER"),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    duration: integer("duration").notNull().default(30),
    locationType: varchar("location_type", { length: 30 })
      .notNull()
      .default("VIDEO_DYTE"),
    color: varchar("color", { length: 7 }).default("#3B82F6"),
    isActive: boolean("is_active").notNull().default(true),
    inboxId: integer("inbox_id").references(() => inboxes.id, {
      onDelete: "set null",
    }),
    // JSONB settings: { bufferMinutes, minNoticeHours, maxBookingsPerDay, customQuestions: [] }
    settings: jsonb("settings").default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("calendar_event_types_slug_account_idx").on(
      table.accountId,
      table.scope,
      table.slug,
    ),
  ],
);

// ─── Schedules (Weekly Availability) ─────────────────────────────────────────
// availability JSONB: [{ dayOfWeek: 1, periods: [{ start: "09:00", end: "17:00" }] }]
// dayOfWeek: 0=Sun, 1=Mon … 6=Sat

export const calendarSchedules = pgTable("calendar_schedules", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull().default("Working Hours"),
  timezone: varchar("timezone", { length: 100 })
    .notNull()
    .default("UTC"),
  availability: jsonb("availability").notNull().default([]),
  isDefault: boolean("is_default").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const calendarBookings = pgTable("calendar_bookings", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  eventTypeId: integer("event_type_id")
    .notNull()
    .references(() => calendarEventTypes.id, { onDelete: "cascade" }),
  assignedUserId: integer("assigned_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("CONFIRMED"),
  notes: text("notes"),
  location: text("location"),
  meetingUrl: text("meeting_url"),
  cancelToken: varchar("cancel_token", { length: 64 }).notNull().unique(),
  rescheduleToken: varchar("reschedule_token", { length: 64 }).unique(),
  // JSONB metadata: answers to custom questions, reschedule history, etc.
  metadata: jsonb("metadata").default({}),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Blocked Times ────────────────────────────────────────────────────────────

export const calendarBlockedTimes = pgTable("calendar_blocked_times", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── External Calendar Connections ───────────────────────────────────────────
// provider: GOOGLE_CALENDAR | OUTLOOK | CALDAV | GOOGLE_MEET | ZOOM
// credentials JSONB: { accessToken, refreshToken, expiresAt, calendarId, ... }

export const calendarExternalConns = pgTable(
  "calendar_external_conns",
  {
    id: serial("id").primaryKey(),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 30 }).notNull(),
    credentials: jsonb("credentials").notNull().default({}),
    externalCalendarId: varchar("external_calendar_id", { length: 255 }),
    syncEnabled: boolean("sync_enabled").notNull().default(true),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("calendar_external_conns_unique_idx").on(
      table.userId,
      table.provider,
    ),
  ],
);
