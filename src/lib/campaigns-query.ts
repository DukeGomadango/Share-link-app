import { and, desc, eq } from "drizzle-orm";

import type { Campaign } from "@/components/features/campaigns/types";
import { getDb } from "@/db";
import { campaigns } from "@/db/schema";

import { uiStatusFromDb } from "@/lib/campaign-status";

type CampaignRow = typeof campaigns.$inferSelect;

function mapCampaignRow(row: CampaignRow): Campaign {
  const totalFiles = row.totalFilesCount;
  const assignedRecipients = row.assignedRecipientsCount;
  const claimed = row.claimedRecipientsCount;
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
    isExternalLinked: row.isExternalLinked,
    gachaConfig: row.gachaConfig as Campaign["gachaConfig"],
    stats: {
      totalFiles,
      assignedRecipients,
      openRate,
    },
  };
}

export async function fetchCampaignById(
  workspaceId: string,
  campaignId: string
): Promise<Campaign | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId)))
    .limit(1);

  if (!row) {
    return null;
  }

  return mapCampaignRow(row);
}

export async function fetchCampaignsWithStats(workspaceId: string): Promise<Campaign[]> {
  const db = getDb();
  const list = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.workspaceId, workspaceId))
    .orderBy(desc(campaigns.createdAt));

  if (list.length === 0) {
    return [];
  }

  return list.map(mapCampaignRow);
}

/** @deprecated prefer fetchCampaignById */
export async function fetchCampaignWithStats(
  workspaceId: string,
  campaignId: string
): Promise<Campaign | null> {
  return fetchCampaignById(workspaceId, campaignId);
}
