import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  campaignAssets,
  campaignRecipientSlots,
  claims,
} from "@/db/schema";

/**
 * claimSecret が属するキャンペーン ID を返す（セッション API で campaignId と一致検証用）
 */
export async function getCampaignIdForClaimSecret(
  claimSecret: string
): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({
      claim: claims,
      slot: campaignRecipientSlots,
      ca: campaignAssets,
    })
    .from(claims)
    .leftJoin(
      campaignRecipientSlots,
      eq(claims.recipientSlotId, campaignRecipientSlots.id)
    )
    .leftJoin(campaignAssets, eq(claims.campaignAssetId, campaignAssets.id))
    .where(eq(claims.claimSecret, claimSecret))
    .limit(1);

  const hit = rows[0];
  if (!hit) return null;

  if (hit.slot?.campaignId) return hit.slot.campaignId;
  if (hit.ca?.campaignId) return hit.ca.campaignId;
  return null;
}
