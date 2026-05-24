import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  assets,
  campaignAssets,
  claimAssets,
  claims,
  slotAssets,
} from "@/db/schema";
import { buildClaimBundleForSecret } from "@/lib/claim/bundle-for-token";

export type ClaimFileDownloadSource =
  | { kind: "r2"; objectKey: string }
  | { kind: "url"; url: string };

export type ClaimFileDownloadMeta = {
  filename: string;
  mimeType: string;
  source: ClaimFileDownloadSource;
};

/**
 * 受取トークンと campaign_asset ID から、ダウンロード用の実体を解決する。
 * バンドルに含まれるファイルのみ許可する。
 */
export async function resolveClaimFileDownload(
  claimSecret: string,
  campaignAssetId: string,
  sessionSecret?: string
): Promise<ClaimFileDownloadMeta | null> {
  const bundle = await buildClaimBundleForSecret(claimSecret, sessionSecret);
  if (!bundle?.isAuthorized) {
    return null;
  }

  const inBundle = bundle.files.some((f) => f.id === campaignAssetId);
  if (!inBundle) {
    return null;
  }

  const db = getDb();
  const claimRow = await db
    .select({
      claimId: claims.id,
      slotId: claims.recipientSlotId,
    })
    .from(claims)
    .where(eq(claims.claimSecret, claimSecret))
    .limit(1);

  const claim = claimRow[0];
  if (!claim) {
    return null;
  }

  const [claimLink, slotLink] = await Promise.all([
    db
      .select({ id: claimAssets.claimId })
      .from(claimAssets)
      .where(
        and(
          eq(claimAssets.claimId, claim.claimId),
          eq(claimAssets.campaignAssetId, campaignAssetId)
        )
      )
      .limit(1),
    claim.slotId
      ? db
          .select({ id: slotAssets.slotId })
          .from(slotAssets)
          .where(
            and(
              eq(slotAssets.slotId, claim.slotId),
              eq(slotAssets.campaignAssetId, campaignAssetId)
            )
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  if (!claimLink[0] && !slotLink[0]) {
    return null;
  }

  const row = await db
    .select({
      ca: campaignAssets,
      asset: assets,
    })
    .from(campaignAssets)
    .leftJoin(assets, eq(campaignAssets.assetId, assets.id))
    .where(eq(campaignAssets.id, campaignAssetId))
    .limit(1);

  const hit = row[0];
  if (!hit) {
    return null;
  }

  if (hit.asset) {
    if (hit.asset.expiresAt && hit.asset.expiresAt < new Date()) {
      return null;
    }
    const filename =
      hit.asset.originalFilename ?? hit.ca.label?.trim() ?? "download";
    return {
      filename,
      mimeType: hit.asset.mimeType ?? "application/octet-stream",
      source: { kind: "r2", objectKey: hit.asset.objectKey },
    };
  }

  const externalUrl = hit.ca.assetUrl?.trim();
  if (!externalUrl) {
    return null;
  }

  const filename = hit.ca.label?.trim() ?? "download";
  return {
    filename,
    mimeType: "application/octet-stream",
    source: { kind: "url", url: externalUrl },
  };
}
