CREATE TABLE "channel_whatsapp" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"phone_number" varchar(20),
	"provider_type" varchar(20) DEFAULT 'baileys' NOT NULL,
	"status" varchar(20) DEFAULT 'disconnected' NOT NULL,
	"session_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channel_whatsapp" ADD CONSTRAINT "channel_whatsapp_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;