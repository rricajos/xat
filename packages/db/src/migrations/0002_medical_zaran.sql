CREATE TABLE "channel_facebook" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"page_id" varchar(255) NOT NULL,
	"page_access_token" text NOT NULL,
	"user_access_token" text,
	"page_name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_telegram" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"bot_token" varchar(255) NOT NULL,
	"bot_username" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "file_name" varchar(512);--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "mime_type" varchar(255);--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "file_size" integer;--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "storage_path" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "muted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "channel_facebook" ADD CONSTRAINT "channel_facebook_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_telegram" ADD CONSTRAINT "channel_telegram_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_roles" ADD CONSTRAINT "custom_roles_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;