import { eq, inArray } from "drizzle-orm";

import type { getDb } from "@/db";
import { claimAssets, claims, slotAssets } from "@/db/schema";

type Db = ReturnType<typeof getDb>;

/**
 * スロットに紐づく全 Claim の claim_assets を集約し、slot_assets を再構築する。
 * マージ後に複数 Claim が同一スロットを共有する場合でも、他 Claim の品目を消さない。
 */
export async function recomputeSlotAssetsFromClaims(
  db: Db,
  slotId: string
): Promise<void> {
  const claimRows = await db
    .select({ id: claims.id })
    .from(claims)
    .where(eq(claims.recipientSlotId, slotId));

  const claimIds = claimRows.map((r) => r.id);
  await db.delete(slotAssets).where(eq(slotAssets.slotId, slotId));

  if (claimIds.length === 0) return;

  const assetRows = await db
    .select({ campaignAssetId: claimAssets.campaignAssetId })
    .from(claimAssets)
    .where(inArray(claimAssets.claimId, claimIds));

  const uniqueIds = [...new Set(assetRows.map((r) => r.campaignAssetId))];
  if (uniqueIds.length === 0) return;

  await db.insert(slotAssets).values(
    uniqueIds.map((campaignAssetId) => ({
      slotId,
      campaignAssetId,
    }))
  );
}
