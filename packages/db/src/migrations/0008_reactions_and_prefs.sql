-- Phase 42: Message reactions
CREATE TABLE IF NOT EXISTS "message_reactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "account_id" integer NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "message_id" integer NOT NULL REFERENCES "messages"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "emoji" varchar(10) NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "message_reactions_unique_idx" ON "message_reactions" ("message_id","user_id","emoji");

-- Phase 44: Notification preferences
CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" serial PRIMARY KEY NOT NULL,
  "account_id" integer NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "notification_type" varchar(50) NOT NULL,
  "email_enabled" boolean DEFAULT true NOT NULL,
  "push_enabled" boolean DEFAULT true NOT NULL,
  "web_enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "notification_prefs_unique_idx" ON "notification_preferences" ("user_id","notification_type");
