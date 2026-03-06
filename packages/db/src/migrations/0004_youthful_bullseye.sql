CREATE TABLE "channel_instagram" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"page_id" varchar(255) NOT NULL,
	"page_access_token" text NOT NULL,
	"instagram_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_line" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"channel_access_token" text NOT NULL,
	"channel_secret" varchar(255) NOT NULL,
	"line_channel_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_sms" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"provider_type" varchar(20) DEFAULT 'twilio' NOT NULL,
	"account_sid" varchar(255) NOT NULL,
	"auth_token" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_twitter" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"api_key" varchar(255) NOT NULL,
	"api_secret" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"access_token_secret" text NOT NULL,
	"twitter_account_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "channel_instagram" ADD CONSTRAINT "channel_instagram_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_line" ADD CONSTRAINT "channel_line_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_sms" ADD CONSTRAINT "channel_sms_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_twitter" ADD CONSTRAINT "channel_twitter_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;