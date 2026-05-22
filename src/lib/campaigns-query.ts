import { desc, eq } from "drizzle-orm";

import type { Campaign } from "@/components/features/campaigns/types";
import { getDb } from "@/db";
import {
  campaigns,
} from "@/db/schema";

import { uiStatusFromDb } from "@/lib/campaign-status";

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

  return list.map((row) => {
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
  });
}

export async function fetchCampaignWithStats(
  workspaceId: string,
  campaignId: string
): Promise<Campaign | null> {
  const rows = await fetchCampaignsWithStats(workspaceId);
  return rows.find((c) => c.id === campaignId) ?? null;
}
