-- Migration 0006: Calendar Feature
-- Adds calendar_username to users + 5 new calendar tables

-- Add calendar username to users
ALTER TABLE "users" ADD COLUMN "calendar_username" varchar(50) UNIQUE;

-- Event Types
CREATE TABLE "calendar_event_types" (
  "id" serial PRIMARY KEY,
  "account_id" integer NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
  "team_id" integer REFERENCES "teams"("id") ON DELETE CASCADE,
  "scope" varchar(10) NOT NULL DEFAULT 'USER',
  "name" varchar(255) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "description" text,
  "duration" integer NOT NULL DEFAULT 30,
  "location_type" varchar(30) NOT NULL DEFAULT 'VIDEO_DYTE',
  "color" varchar(7) DEFAULT '#3B82F6',
  "is_active" boolean NOT NULL DEFAULT true,
  "inbox_id" integer REFERENCES "inboxes"("id") ON DELETE SET NULL,
  "settings" jsonb DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "calendar_event_types_slug_account_idx"
  ON "calendar_event_types" ("account_id", "scope", "slug");

-- Weekly Availability Schedules
CREATE TABLE "calendar_schedules" (
  "id" serial PRIMARY KEY,
  "account_id" integer NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL DEFAULT 'Working Hours',
  "timezone" varchar(100) NOT NULL DEFAULT 'UTC',
  "availability" jsonb NOT NULL DEFAULT '[]',
  "is_default" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE "calendar_bookings" (
  "id" serial PRIMARY KEY,
  "account_id" integer NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "event_type_id" integer NOT NULL REFERENCES "calendar_event_types"("id") ON DELETE CASCADE,
  "assigned_user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "contact_id" integer REFERENCES "contacts"("id") ON DELETE SET NULL,
  "contact_name" varchar(255) NOT NULL,
  "contact_email" varchar(255) NOT NULL,
  "contact_phone" varchar(50),
  "start_at" timestamptz NOT NULL,
  "end_at" timestamptz NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'CONFIRMED',
  "notes" text,
  "location" text,
  "meeting_url" text,
  "cancel_token" varchar(64) NOT NULL UNIQUE,
  "metadata" jsonb DEFAULT '{}',
  "cancelled_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "calendar_bookings_user_time_idx"
  ON "calendar_bookings" ("assigned_user_id", "start_at", "end_at");
CREATE INDEX "calendar_bookings_account_status_idx"
  ON "calendar_bookings" ("account_id", "status");

-- Blocked Times
CREATE TABLE "calendar_blocked_times" (
  "id" serial PRIMARY KEY,
  "account_id" integer NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "start_at" timestamptz NOT NULL,
  "end_at" timestamptz NOT NULL,
  "reason" varchar(255),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- External Calendar Connections (Google, Outlook, Zoom, etc.)
CREATE TABLE "calendar_external_conns" (
  "id" serial PRIMARY KEY,
  "account_id" integer NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" varchar(30) NOT NULL,
  "credentials" jsonb NOT NULL DEFAULT '{}',
  "external_calendar_id" varchar(255),
  "sync_enabled" boolean NOT NULL DEFAULT true,
  "last_sync_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "calendar_external_conns_unique_idx"
  ON "calendar_external_conns" ("user_id", "provider");
