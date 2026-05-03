CREATE TABLE "integration_idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_token_id" uuid NOT NULL,
	"route_key" text NOT NULL,
	"idempotency_key_hash" text NOT NULL,
	"response_body" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integration_idempotency_keys" ADD CONSTRAINT "integration_idempotency_keys_integration_token_id_integration_access_tokens_id_fk" FOREIGN KEY ("integration_token_id") REFERENCES "public"."integration_access_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "integration_idempotency_unique" ON "integration_idempotency_keys" USING btree ("integration_token_id","route_key","idempotency_key_hash");--> statement-breakpoint
CREATE INDEX "integration_idempotency_expires_at_idx" ON "integration_idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_access_tokens_token_hash_idx" ON "integration_access_tokens" USING btree ("token_hash");