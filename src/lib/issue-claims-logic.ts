import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { campaignAssets, campaigns, claims } from "@/db/schema";

export type IssueClaimItemInput = {
  campaign_asset_id: string;
  external_transaction_id: string;
  recipient_display_name?: string | null;
};

export type IssueClaimResultRow = {
  external_transaction_id: string;
  ok: boolean;
  claim_url?: string | null;
  error?: string | null;
};

function newClaimSecret(): string {
  return randomBytes(32).toString("base64url");
}

export async function issueClaimsBatch(
  workspaceId: string,
  items: IssueClaimItemInput[],
  claimUrlForSecret: (secret: string) => string
): Promise<IssueClaimResultRow[]> {
  const db = getDb();
  const results: IssueClaimResultRow[] = [];

  for (const item of items) {
    const extId = item.external_transaction_id?.trim();
    if (!extId) {
      results.push({
        external_transaction_id: item.external_transaction_id ?? "",
        ok: false,
        error: "external_transaction_id が空です",
      });
      continue;
    }

    const existing = await db
      .select({ claim: claims })
      .from(claims)
      .where(eq(claims.externalTransactionId, extId))
      .limit(1);

    if (existing[0]) {
      results.push({
        external_transaction_id: extId,
        ok: true,
        claim_url: claimUrlForSecret(existing[0].claim.claimSecret),
      });
      continue;
    }

    const assetRow = await db
      .select({
        asset: campaignAssets,
        campaign: campaigns,
      })
      .from(campaignAssets)
      .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
      .where(eq(campaignAssets.id, item.campaign_asset_id))
      .limit(1);

    const row = assetRow[0];
    if (!row || row.campaign.workspaceId !== workspaceId) {
      results.push({
        external_transaction_id: extId,
        ok: false,
        error: "campaign_asset が見つからないか、ワークスペースと一致しません",
      });
      continue;
    }

    const secret = newClaimSecret();
    try {
      await db.insert(claims).values({
        campaignAssetId: item.campaign_asset_id,
        externalTransactionId: extId,
        claimSecret: secret,
        recipientDisplayName: item.recipient_display_name?.trim() || null,
        status: "issued",
      });
      results.push({
        external_transaction_id: extId,
        ok: true,
        claim_url: claimUrlForSecret(secret),
      });
    } catch {
      const again = await db
        .select({ claim: claims })
        .from(claims)
        .where(eq(claims.externalTransactionId, extId))
        .limit(1);
      if (again[0]) {
        results.push({
          external_transaction_id: extId,
          ok: true,
          claim_url: claimUrlForSecret(again[0].claim.claimSecret),
        });
      } else {
        results.push({
          external_transaction_id: extId,
          ok: false,
          error: "Claim の作成に失敗しました",
        });
      }
    }
  }

  return results;
}
