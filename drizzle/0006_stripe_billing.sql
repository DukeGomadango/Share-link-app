DO $$ BEGIN
  CREATE TYPE "billing_tier" AS ENUM ('pro', 'supporter');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "subscription_current_period_end" timestamp with time zone;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "billing_tier" "billing_tier";

CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_stripe_customer_id_unique"
  ON "workspaces" ("stripe_customer_id")
  WHERE "stripe_customer_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "event_id" text PRIMARY KEY NOT NULL,
  "processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
