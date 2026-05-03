import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  campaignRecipientSlots,
  campaigns,
  claimAssets,
  claimIdentityLinks,
  claims,
  slotAssets,
} from "@/db/schema";

export type WorkflowRecipientRow = {
  claimId: string;
  claimSecret: string;
  recipientDisplayName: string | null;
  listenerNote: string | null;
  assignedFileIds: string[];
  distributionMode: string;
  /** claim と listener_identity が WebAuthn で紐づいている */
  passkeyVerified: boolean;
};

export async function fetchWorkflowRecipientsForCampaign(
  campaignId: string,
  workspaceId: string
): Promise<WorkflowRecipientRow[]> {
  const db = getDb();

  const camp = await db
    .select({ distributionMode: campaigns.distributionMode })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId)))
    .limit(1);

  if (!camp[0]) return [];
  const distributionMode = camp[0].distributionMode ?? "per_link";

  // 1. 全ての Claim とそれに関連する Slot を取得
  const rows = await db
    .select({
      claim: claims,
      slot: campaignRecipientSlots,
    })
    .from(claims)
    .leftJoin(campaignRecipientSlots, eq(claims.recipientSlotId, campaignRecipientSlots.id))
    .where(eq(claims.campaignId, campaignId));

  if (rows.length === 0) return [];

  const claimIds = rows.map((r) => r.claim.id);
  const slotIds = rows.map((r) => r.slot?.id).filter((id): id is string => !!id);

  // 2. Claim または Slot に紐づくアセットを一括取得
  const [cAssets, sAssets, linkRows] = await Promise.all([
    db.select().from(claimAssets).where(inArray(claimAssets.claimId, claimIds)),
    slotIds.length > 0
      ? db.select().from(slotAssets).where(inArray(slotAssets.slotId, slotIds))
      : Promise.resolve([]),
    db
      .select({ claimId: claimIdentityLinks.claimId })
      .from(claimIdentityLinks)
      .where(inArray(claimIdentityLinks.claimId, claimIds)),
  ]);

  const linked = new Set(linkRows.map((r) => r.claimId));

  // アセットをマッピング
  const assetsByClaim = new Map<string, string[]>();
  const assetsBySlot = new Map<string, string[]>();

  for (const ca of cAssets) {
    const list = assetsByClaim.get(ca.claimId) ?? [];
    list.push(ca.campaignAssetId);
    assetsByClaim.set(ca.claimId, list);
  }
  for (const sa of sAssets) {
    const list = assetsBySlot.get(sa.slotId) ?? [];
    list.push(sa.campaignAssetId);
    assetsBySlot.set(sa.slotId, list);
  }

  return rows.map((r) => {
    const claimId = r.claim.id;
    const slotId = r.slot?.id;

    // 優先順位: Claim に直接紐づくアセット > Slot に紐づくアセット
    const assignedSet = new Set([
      ...(assetsByClaim.get(claimId) ?? []),
      ...(slotId ? assetsBySlot.get(slotId) ?? [] : []),
    ]);

    const name =
      r.slot?.listenerDisplayName?.trim() ||
      r.claim.recipientDisplayName?.trim() ||
      "（無名）";

    return {
      claimId,
      claimSecret: r.claim.claimSecret,
      recipientDisplayName: name,
      listenerNote: r.slot?.listenerNote?.trim() || null,
      assignedFileIds: Array.from(assignedSet),
      distributionMode,
      passkeyVerified: linked.has(claimId),
    };
  });
}
