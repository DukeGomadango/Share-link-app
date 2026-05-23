import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { campaigns } from "@/db/schema";
import { ensurePublicReceptionToken } from "@/lib/campaigns/public-reception-token";
import { publicBaseUrlFromRequest } from "@/lib/public-base-url";

export type RecipientSlotPayloadInput = {
  campaignId: string;
  claimId: string;
  claimSecret: string;
  slotId: string | null;
  recipientId: string | null;
  externalTxId: string;
  linkedAssetCount: number;
  slotStatus: "ready" | "unlinked";
  resolvedExisting: boolean;
};

export async function buildRecipientSlotPayload(
  request: Request,
  input: RecipientSlotPayloadInput
): Promise<Record<string, unknown>> {
  const db = getDb();
  const [camp] = await db
    .select({
      distributionMode: campaigns.distributionMode,
    })
    .from(campaigns)
    .where(eq(campaigns.id, input.campaignId))
    .limit(1);

  const distributionMode = camp?.distributionMode ?? "per_link";
  const base = publicBaseUrlFromRequest(request);

  const payload: Record<string, unknown> = {
    ok: true,
    claim_id: input.claimId,
    slot_id: input.slotId,
    recipient_id: input.recipientId,
    external_transaction_id: input.externalTxId,
    linked_asset_count: input.linkedAssetCount,
    delivery_mode: distributionMode,
    slot_status: input.slotStatus,
    resolved_existing: input.resolvedExisting,
  };

  if (distributionMode === "reception") {
    const token = await ensurePublicReceptionToken(input.campaignId);
    payload.reception_url = `${base}/receive/${encodeURIComponent(token)}`;
  } else {
    payload.claim_url = `${base}/claim/${encodeURIComponent(input.claimSecret)}`;
  }

  return payload;
}

export async function buildRecipientSlotLookupPayload(
  request: Request,
  campaignId: string,
  row: {
    claimSecret: string;
    claimId: string;
    slotId: string;
    recipientId: string | null;
    externalTxId: string;
  }
): Promise<Record<string, unknown>> {
  const db = getDb();
  const [camp] = await db
    .select({ distributionMode: campaigns.distributionMode })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  const distributionMode = camp?.distributionMode ?? "per_link";
  const base = publicBaseUrlFromRequest(request);

  const payload: Record<string, unknown> = {
    ok: true,
    linked: true,
    claim_id: row.claimId,
    slot_id: row.slotId,
    recipient_id: row.recipientId,
    external_transaction_id: row.externalTxId,
    delivery_mode: distributionMode,
  };

  if (distributionMode === "reception") {
    const token = await ensurePublicReceptionToken(campaignId);
    payload.reception_url = `${base}/receive/${encodeURIComponent(token)}`;
  } else {
    payload.claim_url = `${base}/claim/${encodeURIComponent(row.claimSecret)}`;
  }

  return payload;
}
