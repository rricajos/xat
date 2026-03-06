-- Username redirects: keeps old username pointing to new one for a limited period
CREATE TABLE IF NOT EXISTS "username_redirects" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "old_username" varchar(50) NOT NULL,
  "new_username" varchar(50) NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "username_redirects_old_idx" ON "username_redirects" ("old_username");
CREATE INDEX IF NOT EXISTS "username_redirects_user_idx" ON "username_redirects" ("user_id");
