ALTER TABLE "claims" DROP CONSTRAINT IF EXISTS "claims_external_transaction_id_unique";
DROP INDEX IF EXISTS "claims_external_transaction_id_unique";

CREATE UNIQUE INDEX IF NOT EXISTS "claims_campaign_external_transaction_uidx"
  ON "claims" ("campaign_id", "external_transaction_id");

ALTER TABLE "assets"
  ADD CONSTRAINT "assets_size_bytes_positive"
  CHECK ("size_bytes" > 0) NOT VALID;

CREATE OR REPLACE FUNCTION "public"."enforce_campaign_asset_workspace_match"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  campaign_workspace uuid;
  asset_workspace uuid;
BEGIN
  IF NEW."asset_id" IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT "workspace_id" INTO campaign_workspace
  FROM "campaigns"
  WHERE "id" = NEW."campaign_id";

  SELECT "workspace_id" INTO asset_workspace
  FROM "assets"
  WHERE "id" = NEW."asset_id";

  IF campaign_workspace IS NULL OR asset_workspace IS NULL OR campaign_workspace <> asset_workspace THEN
    RAISE EXCEPTION 'campaign asset workspace mismatch';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "campaign_assets_workspace_match" ON "campaign_assets";
CREATE TRIGGER "campaign_assets_workspace_match"
  BEFORE INSERT OR UPDATE OF "campaign_id", "asset_id" ON "campaign_assets"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."enforce_campaign_asset_workspace_match"();

ALTER TABLE "workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stripe_webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recipients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campaign_recipient_slots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "slot_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "claim_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listener_identities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webauthn_credentials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webauthn_challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "claim_identity_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "integration_access_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "integration_idempotency_keys" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM "anon";
REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM "authenticated";
GRANT SELECT ON "workspace_members", "campaigns", "assets" TO "authenticated";

DROP POLICY IF EXISTS "workspace_members_self_select" ON "workspace_members";
CREATE POLICY "workspace_members_self_select"
ON "workspace_members"
FOR SELECT
TO "authenticated"
USING ("user_id" = auth.uid());

DROP POLICY IF EXISTS "campaigns_workspace_member_select" ON "campaigns";
CREATE POLICY "campaigns_workspace_member_select"
ON "campaigns"
FOR SELECT
TO "authenticated"
USING (
  EXISTS (
    SELECT 1
    FROM "workspace_members" wm
    WHERE wm."workspace_id" = "campaigns"."workspace_id"
      AND wm."user_id" = auth.uid()
  )
);

DROP POLICY IF EXISTS "assets_workspace_member_select" ON "assets";
CREATE POLICY "assets_workspace_member_select"
ON "assets"
FOR SELECT
TO "authenticated"
USING (
  EXISTS (
    SELECT 1
    FROM "workspace_members" wm
    WHERE wm."workspace_id" = "assets"."workspace_id"
      AND wm."user_id" = auth.uid()
  )
);
