-- Phase 37: CSAT email survey token
ALTER TABLE "csat_survey_responses"
  ALTER COLUMN "rating" DROP NOT NULL,
  ADD COLUMN "token" varchar(64) UNIQUE,
  ADD COLUMN "survey_email_sent_at" timestamptz;

-- Phase 39: Calendar booking reschedule token
ALTER TABLE "calendar_bookings"
  ADD COLUMN "reschedule_token" varchar(64) UNIQUE;

-- Phase 40: Email signature per inbox
ALTER TABLE "channel_email"
  ADD COLUMN "email_signature" text;

-- Phase 41: Two-factor authentication
ALTER TABLE "users"
  ADD COLUMN "two_factor_secret" varchar(255),
  ADD COLUMN "two_factor_enabled" boolean NOT NULL DEFAULT false;
