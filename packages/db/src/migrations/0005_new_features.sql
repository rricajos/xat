-- Phase 21: Conversation Workflows
CREATE TABLE IF NOT EXISTS "conversation_workflows" (
  "id" serial PRIMARY KEY,
  "account_id" integer NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "enabled" boolean DEFAULT true,
  "trigger_action" varchar(50) NOT NULL,
  "required_attributes" jsonb DEFAULT '[]',
  "validation_message" text,
  "inbox_ids" jsonb DEFAULT '[]',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "conv_workflows_account_idx" ON "conversation_workflows" ("account_id");

-- Phase 24: Push Subscriptions
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "push_subs_user_idx" ON "push_subscriptions" ("user_id");

-- Phase 28: Slack Channel
CREATE TABLE IF NOT EXISTS "channel_slack" (
  "id" serial PRIMARY KEY,
  "account_id" integer NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "slack_team_id" varchar(255) NOT NULL,
  "slack_channel_id" varchar(255) NOT NULL,
  "bot_token" text NOT NULL,
  "bot_user_id" varchar(255),
  "slack_team_name" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
