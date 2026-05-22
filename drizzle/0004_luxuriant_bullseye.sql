ALTER TABLE "claims" DROP CONSTRAINT "claims_campaign_asset_id_campaign_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "campaigns" DROP COLUMN "use_otp";--> statement-breakpoint
ALTER TABLE "claims" DROP COLUMN "campaign_asset_id";