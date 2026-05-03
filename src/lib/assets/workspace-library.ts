import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { assets, campaignAssets, campaigns } from "@/db/schema";

export type WorkspaceAssetRow = typeof assets.$inferSelect;

export async function fetchAssetsWithCampaignLabels(
  workspaceId: string
): Promise<Array<WorkspaceAssetRow & { linkedCampaigns: string[] }>> {
  const db = getDb();
  const rows = await db
    .select({ asset: assets })
    .from(assets)
    .where(eq(assets.workspaceId, workspaceId))
    .orderBy(desc(assets.createdAt));

  const assetIds = rows.map((r) => r.asset.id);
  if (assetIds.length === 0) {
    return [];
  }

  const links = await db
    .select({
      assetId: campaignAssets.assetId,
      campaignName: campaigns.name,
    })
    .from(campaignAssets)
    .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
    .where(inArray(campaignAssets.assetId, assetIds));

  const map = new Map<string, string[]>();
  for (const link of links) {
    if (!link.assetId) continue;
    const list = map.get(link.assetId) ?? [];
    list.push(link.campaignName);
    map.set(link.assetId, list);
  }

  return rows.map(({ asset }) => ({
    ...asset,
    linkedCampaigns: map.get(asset.id) ?? [],
  }));
}

/** campaign のワークスペース一致を確認してから campaign_assets を削除（アサイン解除） */
export async function deleteCampaignAssetLinks(args: {
  workspaceId: string;
  campaignId: string;
  assetIds: string[];
}): Promise<number> {
  const { workspaceId, campaignId, assetIds } = args;
  if (assetIds.length === 0) {
    return 0;
  }
  const db = getDb();
  const row = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId)))
    .limit(1);
  if (!row[0]) {
    return 0;
  }

  const result = await db
    .delete(campaignAssets)
    .where(
      and(
        eq(campaignAssets.campaignId, campaignId),
        inArray(campaignAssets.assetId, assetIds)
      )
    )
    .returning({ id: campaignAssets.id });

  return result.length;
}