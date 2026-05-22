ALTER TABLE "integration_access_tokens" ADD COLUMN IF NOT EXISTS "last_used_at" timestamp with time zone;
