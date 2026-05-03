import { and, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import {
  campaignAssets,
  campaignRecipientSlots,
  campaigns,
  claimIdentityLinks,
  claims,
} from "@/db/schema";

export type WorkflowRecipientRow = {
  claimId: string;
  claimSecret: string;
  recipientDisplayName: string | null;
  listenerNote: string | null;
  effectiveCampaignAssetId: string | null;
  distributionMode: string;
  /** claim と listener_identity が WebAuthn で紐づいている */
  passkeyVerified: boolean;
};

/**
 * キャンペーンに属する全 Claim（レガシー: asset 直参照 / 受付: slot 経由）を列挙する。
 */
export async function fetchWorkflowRecipientsForCampaign(
  campaignId: string,
  workspaceId: string
): Promise<WorkflowRecipientRow[]> {
  const db = getDb();

  const camp = await db
    .select({
      distributionMode: campaigns.distributionMode,
    })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId)))
    .limit(1);

  if (!camp[0]) {
    return [];
  }

  const distributionMode = camp[0].distributionMode ?? "per_link";

  const viaAsset = await db
    .select({
      claim: claims,
      slot: campaignRecipientSlots,
      ca: campaignAssets,
    })
    .from(claims)
    .innerJoin(campaignAssets, eq(claims.campaignAssetId, campaignAssets.id))
    .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
    .leftJoin(
      campaignRecipientSlots,
      eq(claims.recipientSlotId, campaignRecipientSlots.id)
    )
    .where(
      and(eq(campaignAssets.campaignId, campaignId), eq(campaigns.workspaceId, workspaceId))
    );

  const slotRows = await db
    .select({ id: campaignRecipientSlots.id })
    .from(campaignRecipientSlots)
    .innerJoin(campaigns, eq(campaignRecipientSlots.campaignId, campaigns.id))
    .where(
      and(
        eq(campaignRecipientSlots.campaignId, campaignId),
        eq(campaigns.workspaceId, workspaceId)
      )
    );

  const slotIdList = slotRows.map((r) => r.id);
  const viaSlot =
    slotIdList.length === 0
      ? []
      : await db
          .select({
            claim: claims,
            slot: campaignRecipientSlots,
            ca: campaignAssets,
          })
          .from(claims)
          .innerJoin(
            campaignRecipientSlots,
            eq(claims.recipientSlotId, campaignRecipientSlots.id)
          )
          .leftJoin(
            campaignAssets,
            eq(campaignRecipientSlots.campaignAssetId, campaignAssets.id)
          )
          .where(inArray(campaignRecipientSlots.id, slotIdList));

  const seen = new Set<string>();
  const out: Array<
    Omit<WorkflowRecipientRow, "passkeyVerified">
  > = [];

  const push = (
    claimRow: typeof claims.$inferSelect,
    slotRow: typeof campaignRecipientSlots.$inferSelect | null,
    assetId: string | null
  ) => {
    if (seen.has(claimRow.id)) return;
    seen.add(claimRow.id);
    const name =
      slotRow?.listenerDisplayName?.trim() ||
      claimRow.recipientDisplayName?.trim() ||
      "（無名）";
    out.push({
      claimId: claimRow.id,
      claimSecret: claimRow.claimSecret,
      recipientDisplayName: name,
      listenerNote: slotRow?.listenerNote?.trim() || null,
      effectiveCampaignAssetId: assetId,
      distributionMode,
    });
  };

  for (const r of viaAsset) {
    push(r.claim, r.slot, r.ca.id);
  }
  for (const r of viaSlot) {
    const assetId = r.ca?.id ?? r.claim.campaignAssetId ?? null;
    push(r.claim, r.slot, assetId);
  }

  const claimIds = out.map((o) => o.claimId);
  const linkRows =
    claimIds.length === 0
      ? []
      : await db
          .select({ claimId: claimIdentityLinks.claimId })
          .from(claimIdentityLinks)
          .where(inArray(claimIdentityLinks.claimId, claimIds));
  const linked = new Set(linkRows.map((r) => r.claimId));

  return out.map((row) => ({
    ...row,
    passkeyVerified: linked.has(row.claimId),
  }));
}
