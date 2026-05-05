import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";

import type { Campaign } from "@/components/features/campaigns/types";
import { getDb } from "@/db";
import {
  campaignAssets,
  campaignRecipientSlots,
  campaigns,
  claims,
} from "@/db/schema";

import { uiStatusFromDb } from "@/lib/campaign-status";

export async function fetchCampaignsWithStats(workspaceId: string): Promise<Campaign[]> {
  const db = getDb();
  const list = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.workspaceId, workspaceId))
    .orderBy(desc(campaigns.createdAt));

  const ids = list.map((c) => c.id);
  if (ids.length === 0) {
    return [];
  }

  // 1. キャンペーン内のアセット総数
  const assetCounts = await db
    .select({
      campaignId: campaignAssets.campaignId,
      n: count(),
    })
    .from(campaignAssets)
    .where(inArray(campaignAssets.campaignId, ids))
    .groupBy(campaignAssets.campaignId);

  // 2. 配布済みリンク（Claim）の総数
  const issuedCounts = await db
    .select({
      campaignId: claims.campaignId,
      n: count(),
    })
    .from(claims)
    .where(inArray(claims.campaignId, ids))
    .groupBy(claims.campaignId);

  // 3. 受取済みリンク（Claimed）の数
  const claimedCounts = await db
    .select({
      campaignId: claims.campaignId,
      n: count(),
    })
    .from(claims)
    .where(and(inArray(claims.campaignId, ids), eq(claims.status, "claimed")))
    .groupBy(claims.campaignId);

  const assetMap = new Map(assetCounts.map((r) => [r.campaignId, Number(r.n)]));
  const issuedMap = new Map(issuedCounts.map((r) => [r.campaignId, Number(r.n)]));
  const claimedMap = new Map(claimedCounts.map((r) => [r.campaignId, Number(r.n)]));

  return list.map((row) => {
    const totalFiles = assetMap.get(row.id) ?? 0;
    const assignedRecipients = issuedMap.get(row.id) ?? 0;
    const claimed = claimedMap.get(row.id) ?? 0;
    const openRate =
      assignedRecipients === 0 ? 0 : Math.round((claimed / assignedRecipients) * 1000) / 10;

    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      tags: (row.tags as string[]) ?? [],
      status: uiStatusFromDb(row.status),
      type: "direct",
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt?.toISOString(),
      securityLevel: (row.securityLevel as Campaign["securityLevel"]) || "standard",
      distributionMode: (row.distributionMode as Campaign["distributionMode"]) ?? "per_link",
      publicReceptionToken: row.publicReceptionToken ?? undefined,
      stats: {
        totalFiles,
        assignedRecipients,
        openRate,
      },
    };
  });
}

export async function fetchCampaignWithStats(
  workspaceId: string,
  campaignId: string
): Promise<Campaign | null> {
  const rows = await fetchCampaignsWithStats(workspaceId);
  return rows.find((c) => c.id === campaignId) ?? null;
}
