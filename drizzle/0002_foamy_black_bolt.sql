CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"bucket" text DEFAULT 'assets' NOT NULL,
	"object_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_recipient_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"recipient_id" uuid,
	"campaign_asset_id" uuid,
	"status" text DEFAULT 'unlinked' NOT NULL,
	"listener_display_name" text,
	"listener_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_identity_links" (
	"claim_id" uuid PRIMARY KEY NOT NULL,
	"listener_identity_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listener_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"linked_recipient_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"platform_id" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webauthn_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge" text NOT NULL,
	"purpose" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"claim_id" uuid,
	"listener_identity_id" uuid,
	"workspace_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webauthn_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listener_identity_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"transports" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webauthn_credentials_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_assets" ALTER COLUMN "asset_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "claims" ALTER COLUMN "campaign_asset_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_assets" ADD COLUMN "asset_id" uuid;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "security_level" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "use_otp" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "distribution_mode" text DEFAULT 'per_link' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "public_reception_token" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "recipient_slot_id" uuid;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipient_slots" ADD CONSTRAINT "campaign_recipient_slots_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipient_slots" ADD CONSTRAINT "campaign_recipient_slots_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipient_slots" ADD CONSTRAINT "campaign_recipient_slots_campaign_asset_id_campaign_assets_id_fk" FOREIGN KEY ("campaign_asset_id") REFERENCES "public"."campaign_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_identity_links" ADD CONSTRAINT "claim_identity_links_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_identity_links" ADD CONSTRAINT "claim_identity_links_listener_identity_id_listener_identities_id_fk" FOREIGN KEY ("listener_identity_id") REFERENCES "public"."listener_identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listener_identities" ADD CONSTRAINT "listener_identities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listener_identities" ADD CONSTRAINT "listener_identities_linked_recipient_id_recipients_id_fk" FOREIGN KEY ("linked_recipient_id") REFERENCES "public"."recipients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_challenges" ADD CONSTRAINT "webauthn_challenges_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_challenges" ADD CONSTRAINT "webauthn_challenges_listener_identity_id_listener_identities_id_fk" FOREIGN KEY ("listener_identity_id") REFERENCES "public"."listener_identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_challenges" ADD CONSTRAINT "webauthn_challenges_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_listener_identity_id_listener_identities_id_fk" FOREIGN KEY ("listener_identity_id") REFERENCES "public"."listener_identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assets_bucket_object_key_uidx" ON "assets" USING btree ("bucket","object_key");--> statement-breakpoint
CREATE INDEX "assets_workspace_id_idx" ON "assets" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "recipient_slots_campaign_id_idx" ON "campaign_recipient_slots" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "recipient_slots_recipient_id_idx" ON "campaign_recipient_slots" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "claim_identity_links_listener_id_idx" ON "claim_identity_links" USING btree ("listener_identity_id");--> statement-breakpoint
CREATE INDEX "listener_identities_workspace_id_idx" ON "listener_identities" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "recipients_workspace_id_idx" ON "recipients" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "webauthn_challenges_expires_at_idx" ON "webauthn_challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "webauthn_credentials_listener_identity_id_idx" ON "webauthn_credentials" USING btree ("listener_identity_id");--> statement-breakpoint
ALTER TABLE "campaign_assets" ADD CONSTRAINT "campaign_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_recipient_slot_id_campaign_recipient_slots_id_fk" FOREIGN KEY ("recipient_slot_id") REFERENCES "public"."campaign_recipient_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_assets_campaign_asset_uidx" ON "campaign_assets" USING btree ("campaign_id","asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_public_reception_token_uidx" ON "campaigns" USING btree ("public_reception_token");--> statement-breakpoint
CREATE INDEX "claims_recipient_slot_id_idx" ON "claims" USING btree ("recipient_slot_id");