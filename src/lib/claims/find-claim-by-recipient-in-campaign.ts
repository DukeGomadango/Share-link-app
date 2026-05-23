import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { campaignRecipientSlots, claims } from "@/db/schema";

export type CampaignClaimRef = {
  claimId: string;
  claimSecret: string;
  slotId: string;
};

/**
 * 名簿 ID に紐づくスロット上の Claim を1件返す（最新 updatedAt 優先）。
 */
export async function findClaimByRecipientInCampaign(
  campaignId: string,
  recipientId: string
): Promise<CampaignClaimRef | null> {
  const db = getDb();
  const rows = await db
    .select({
      claimId: claims.id,
      claimSecret: claims.claimSecret,
      slotId: claims.recipientSlotId,
      updatedAt: claims.updatedAt,
    })
    .from(claims)
    .innerJoin(
      campaignRecipientSlots,
      eq(claims.recipientSlotId, campaignRecipientSlots.id)
    )
    .where(
      and(
        eq(campaignRecipientSlots.campaignId, campaignId),
        eq(campaignRecipientSlots.recipientId, recipientId)
      )
    )
    .orderBy(desc(claims.updatedAt))
    .limit(1);

  const row = rows[0];
  if (!row?.slotId) return null;
  return {
    claimId: row.claimId,
    claimSecret: row.claimSecret,
    slotId: row.slotId,
  };
}
