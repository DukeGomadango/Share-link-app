import { randomBytes } from "node:crypto";
import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { campaignAssets, campaigns, claimAssets, claims } from "@/db/schema";

export type IssueClaimItemInput = {
  /** 複数ファイルを紐づけられるように配列に変更 */
  campaign_asset_ids: string[];
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

    // アセットの存在とワークスペース権限の確認
    if (item.campaign_asset_ids.length === 0) {
      results.push({
        external_transaction_id: extId,
        ok: false,
        error: "アセットが指定されていません",
      });
      continue;
    }

    const assetRows = await db
      .select({ campaignId: campaigns.id })
      .from(campaignAssets)
      .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
      .where(
        and(
          inArray(campaignAssets.id, item.campaign_asset_ids),
          eq(campaigns.workspaceId, workspaceId)
        )
      );

    if (assetRows.length === 0) {
      results.push({
        external_transaction_id: extId,
        ok: false,
        error: "アセットが見つからないか、ワークスペースと一致しません",
      });
      continue;
    }
    const campaignId = assetRows[0].campaignId;

    const secret = newClaimSecret();
    try {
      // 1. Claim の作成
      const [newClaim] = await db
        .insert(claims)
        .values({
          campaignId, // 追加
          externalTransactionId: extId,
          claimSecret: secret,
          recipientDisplayName: item.recipient_display_name?.trim() || null,
          status: "issued",
        })
        .returning({ id: claims.id });

      // 2. 複数のアセットを中間テーブルに紐付け
      if (newClaim) {
        await db.insert(claimAssets).values(
          item.campaign_asset_ids.map((aid) => ({
            claimId: newClaim.id,
            campaignAssetId: aid,
          }))
        );
      }

      results.push({
        external_transaction_id: extId,
        ok: true,
        claim_url: claimUrlForSecret(secret),
      });
    } catch (e) {
      console.error("issueClaimsBatch error:", e);
      results.push({
        external_transaction_id: extId,
        ok: false,
        error: "Claim の作成に失敗しました",
      });
    }
  }

  return results;
}

import { and } from "drizzle-orm";
