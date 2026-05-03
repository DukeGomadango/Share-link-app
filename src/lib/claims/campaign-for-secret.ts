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
      campaignId: claims.campaignId,
    })
    .from(claims)
    .where(eq(claims.claimSecret, claimSecret))
    .limit(1);

  return rows[0]?.campaignId ?? null;
}
