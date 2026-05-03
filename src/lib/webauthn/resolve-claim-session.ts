import { eq } from "drizzle-orm";

import { getCampaignIdForClaimSecret } from "@/lib/claims/campaign-for-secret";
import { claimSessionCookieName } from "@/lib/claims/constants";
import { getDb } from "@/db";
import { campaignRecipientSlots, campaigns, claims } from "@/db/schema";

export type ResolvedClaimSession = {
  claimId: string;
  claimSecret: string;
  campaignId: string;
  workspaceId: string;
  displayName: string;
};

export async function resolveClaimSessionForCampaign(
  campaignId: string,
  claimSecret: string
): Promise<ResolvedClaimSession | null> {
  const cid = await getCampaignIdForClaimSecret(claimSecret);
  if (cid !== campaignId) return null;

  const db = getDb();
  const claimRows = await db
    .select({
      claim: claims,
      slot: campaignRecipientSlots,
    })
    .from(claims)
    .leftJoin(
      campaignRecipientSlots,
      eq(claims.recipientSlotId, campaignRecipientSlots.id)
    )
    .where(eq(claims.claimSecret, claimSecret))
    .limit(1);

  const hit = claimRows[0];
  if (!hit) return null;

  const campRows = await db
    .select({ workspaceId: campaigns.workspaceId })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);
  const ws = campRows[0]?.workspaceId;
  if (!ws) return null;

  const displayName =
    hit.slot?.listenerDisplayName?.trim() ||
    hit.claim.recipientDisplayName?.trim() ||
    "ゲスト";

  return {
    claimId: hit.claim.id,
    claimSecret: hit.claim.claimSecret,
    campaignId,
    workspaceId: ws,
    displayName,
  };
}

export function readClaimSecretFromCookies(
  cookieGetter: (name: string) => string | undefined,
  campaignId: string
): string | undefined {
  return cookieGetter(claimSessionCookieName(campaignId))?.trim();
}
