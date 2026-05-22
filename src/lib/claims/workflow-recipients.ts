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
  id: string;
  claimId: string;
  claimSecret: string;
  recipientDisplayName: string | null;
  listenerNote: string | null;
  assignedFileIds: string[];
  distributionMode: string;
  recipientSlotId: string | null;
  /** claim と listener_identity が WebAuthn で紐づいている */
  passkeyVerified: boolean;
  globalRecipientId: string | null;
  createdAt: string;
  /** ガチャ連携の冪等キー（`gacha-` プレフィックス優先で代表1件） */
  externalTransactionId: string | null;
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

  // 枠（SlotID）ごとにグループ化して集約する
  const slotGroups = new Map<string, WorkflowRecipientRow>();

  for (const r of rows) {
    const claimId = r.claim.id;
    const slotId = r.slot?.id || claimId; // Slot がない場合は ClaimID をキーにする

    const existing = slotGroups.get(slotId);

    // 優先順位: Claim に直接紐づくアセット + Slot に紐づくアセット
    const assignedSet = new Set([
      ...(existing?.assignedFileIds || []),
      ...(assetsByClaim.get(claimId) ?? []),
      ...(r.slot?.id ? assetsBySlot.get(r.slot.id) ?? [] : []),
    ]);

    const name =
      r.slot?.listenerDisplayName?.trim() ||
      r.claim.recipientDisplayName?.trim() ||
      existing?.recipientDisplayName ||
      "（無名）";

    const claimExtId = r.claim.externalTransactionId?.trim() || null;
    const pickExtId = (prev: string | null | undefined, next: string | null): string | null => {
      if (next?.startsWith("gacha-")) return next;
      if (prev?.startsWith("gacha-")) return prev;
      return next ?? prev ?? null;
    };

    slotGroups.set(slotId, {
      id: slotId, // フロントエンドがキーやIDとして使用する
      claimId: existing?.claimId || claimId, // 代表的な ClaimID を1つ保持
      claimSecret: existing?.claimSecret || r.claim.claimSecret,
      recipientDisplayName: name,
      listenerNote: r.slot?.listenerNote?.trim() || existing?.listenerNote || null,
      assignedFileIds: Array.from(assignedSet),
      distributionMode,
      recipientSlotId: r.claim.recipientSlotId,
      passkeyVerified: existing?.passkeyVerified || linked.has(claimId),
      globalRecipientId: r.slot?.recipientId || existing?.globalRecipientId || null,
      createdAt: r.claim.createdAt.toISOString(),
      externalTransactionId: pickExtId(existing?.externalTransactionId, claimExtId),
    });
  }

  return Array.from(slotGroups.values());
}
