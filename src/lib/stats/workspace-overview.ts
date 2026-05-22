import { and, count, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  assets,
  campaignAssets,
  campaigns,
  claims,
} from "@/db/schema";
import type { DashboardOverviewStats } from "@/lib/stats/overview";

export async function computeWorkspaceOverviewStats(
  workspaceId: string
): Promise<DashboardOverviewStats> {
  const db = getDb();

  const [activeRow] = await db
    .select({ n: count() })
    .from(campaigns)
    .where(and(eq(campaigns.workspaceId, workspaceId), eq(campaigns.status, "active")));

  const activeCampaigns = Number(activeRow?.n ?? 0);

  const [issuedRow] = await db
    .select({ n: count() })
    .from(claims)
    .innerJoin(campaigns, eq(claims.campaignId, campaigns.id))
    .where(eq(campaigns.workspaceId, workspaceId));

  const [claimedRow] = await db
    .select({ n: count() })
    .from(claims)
    .innerJoin(campaigns, eq(claims.campaignId, campaigns.id))
    .where(and(eq(campaigns.workspaceId, workspaceId), eq(claims.status, "claimed")));

  const totalDistributed = Number(issuedRow?.n ?? 0);
  const claimed = Number(claimedRow?.n ?? 0);
  const openRate =
    totalDistributed === 0
      ? 0
      : Math.round((claimed / totalDistributed) * 1000) / 10;

  const lib = await db
    .select({ id: assets.id })
    .from(assets)
    .where(eq(assets.workspaceId, workspaceId));

  const linked = await db
    .select({ assetId: campaignAssets.assetId })
    .from(campaignAssets)
    .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
    .where(eq(campaigns.workspaceId, workspaceId));

  const linkedSet = new Set(
    linked.map((l) => l.assetId).filter((x): x is string => x != null)
  );
  const unassignedAssets = lib.filter((a) => !linkedSet.has(a.id)).length;

  return {
    activeCampaigns,
    totalDistributed,
    openRate,
    weeklyViews: 0,
    weekOverWeekGrowth: 0,
    unassignedAssets,
    anomalies: {
      lowOpenRate: totalDistributed >= 10 && openRate < 30,
      noActiveCampaigns: activeCampaigns === 0,
    },
  };
}
