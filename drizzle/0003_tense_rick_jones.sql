CREATE TYPE "public"."plan_tier" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TABLE "claim_assets" (
	"claim_id" uuid NOT NULL,
	"campaign_asset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "claim_assets_claim_id_campaign_asset_id_pk" PRIMARY KEY("claim_id","campaign_asset_id")
);
--> statement-breakpoint
CREATE TABLE "slot_assets" (
	"slot_id" uuid NOT NULL,
	"campaign_asset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slot_assets_slot_id_campaign_asset_id_pk" PRIMARY KEY("slot_id","campaign_asset_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_recipient_slots" DROP CONSTRAINT "campaign_recipient_slots_campaign_asset_id_campaign_assets_id_fk";
--> statement-breakpoint
DROP INDEX "claims_campaign_asset_id_idx";--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaign_assets" ADD COLUMN "gacha_rarity_id" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "is_external_linked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "gacha_config" jsonb;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "total_files_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "assigned_recipients_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "claimed_recipients_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "campaign_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "recipients" ADD COLUMN "listener_note" text;--> statement-breakpoint
ALTER TABLE "recipients" ADD COLUMN "streamer_memo" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "plan_tier" "plan_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "storage_limit" bigint DEFAULT 2147483648 NOT NULL;--> statement-breakpoint
ALTER TABLE "claim_assets" ADD CONSTRAINT "claim_assets_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_assets" ADD CONSTRAINT "claim_assets_campaign_asset_id_campaign_assets_id_fk" FOREIGN KEY ("campaign_asset_id") REFERENCES "public"."campaign_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_assets" ADD CONSTRAINT "slot_assets_slot_id_campaign_recipient_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."campaign_recipient_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_assets" ADD CONSTRAINT "slot_assets_campaign_asset_id_campaign_assets_id_fk" FOREIGN KEY ("campaign_asset_id") REFERENCES "public"."campaign_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "claim_assets_claim_id_idx" ON "claim_assets" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "slot_assets_slot_id_idx" ON "slot_assets" USING btree ("slot_id");--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "claims_campaign_id_idx" ON "claims" USING btree ("campaign_id");--> statement-breakpoint
ALTER TABLE "campaign_recipient_slots" DROP COLUMN "campaign_asset_id";