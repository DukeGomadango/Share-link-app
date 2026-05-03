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

function mergeCountMaps(
  a: Map<string, number>,
  b: Map<string, number>
): Map<string, number> {
  const out = new Map(a);
  for (const [k, v] of b) {
    out.set(k, (out.get(k) ?? 0) + v);
  }
  return out;
}

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

  const assetCounts = await db
    .select({
      campaignId: campaignAssets.campaignId,
      n: count(),
    })
    .from(campaignAssets)
    .where(inArray(campaignAssets.campaignId, ids))
    .groupBy(campaignAssets.campaignId);

  const issuedViaAssets = await db
    .select({
      campaignId: campaignAssets.campaignId,
      n: count(),
    })
    .from(claims)
    .innerJoin(campaignAssets, eq(claims.campaignAssetId, campaignAssets.id))
    .where(inArray(campaignAssets.campaignId, ids))
    .groupBy(campaignAssets.campaignId);

  const issuedViaSlotsOnly = await db
    .select({
      campaignId: campaignRecipientSlots.campaignId,
      n: count(),
    })
    .from(claims)
    .innerJoin(
      campaignRecipientSlots,
      eq(claims.recipientSlotId, campaignRecipientSlots.id)
    )
    .where(
      and(
        inArray(campaignRecipientSlots.campaignId, ids),
        isNull(claims.campaignAssetId)
      )
    )
    .groupBy(campaignRecipientSlots.campaignId);

  const claimedViaAssets = await db
    .select({
      campaignId: campaignAssets.campaignId,
      n: count(),
    })
    .from(claims)
    .innerJoin(campaignAssets, eq(claims.campaignAssetId, campaignAssets.id))
    .where(and(inArray(campaignAssets.campaignId, ids), eq(claims.status, "claimed")))
    .groupBy(campaignAssets.campaignId);

  const claimedViaSlotsOnly = await db
    .select({
      campaignId: campaignRecipientSlots.campaignId,
      n: count(),
    })
    .from(claims)
    .innerJoin(
      campaignRecipientSlots,
      eq(claims.recipientSlotId, campaignRecipientSlots.id)
    )
    .where(
      and(
        inArray(campaignRecipientSlots.campaignId, ids),
        isNull(claims.campaignAssetId),
        eq(claims.status, "claimed")
      )
    )
    .groupBy(campaignRecipientSlots.campaignId);

  const assetMap = new Map(assetCounts.map((r) => [r.campaignId, Number(r.n)]));
  const issuedMap = mergeCountMaps(
    new Map(issuedViaAssets.map((r) => [r.campaignId, Number(r.n)])),
    new Map(issuedViaSlotsOnly.map((r) => [r.campaignId, Number(r.n)]))
  );
  const claimedMap = mergeCountMaps(
    new Map(claimedViaAssets.map((r) => [r.campaignId, Number(r.n)])),
    new Map(claimedViaSlotsOnly.map((r) => [r.campaignId, Number(r.n)]))
  );

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
      useOtp: row.useOtp,
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
