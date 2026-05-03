import { eq } from "drizzle-orm";

import { createSignedReadUrl } from "@/lib/assets/signed-urls";
import { getDb } from "@/db";
import {
  assets,
  campaignAssets,
  campaignRecipientSlots,
  campaigns,
  claims,
} from "@/db/schema";

export type ClaimBundleResponse = {
  expiryIso: string;
  /** ライバー未割当・ファイルなし（リスナーは待機ポーリング） */
  pending?: boolean;
  files: Array<{
    id: string;
    type: "image" | "audio";
    src: string;
    filename: string;
    title: string;
  }>;
};

export async function buildClaimBundleForSecret(
  claimSecret: string
): Promise<ClaimBundleResponse | null> {
  const db = getDb();
  const base = await db
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

  const hit = base[0];
  if (!hit) {
    return null;
  }

  const effectiveAssetId =
    hit.claim.campaignAssetId ?? hit.slot?.campaignAssetId ?? null;

  let campaignId: string | null = null;
  if (effectiveAssetId) {
    const caRow = await db
      .select({ campaignId: campaignAssets.campaignId })
      .from(campaignAssets)
      .where(eq(campaignAssets.id, effectiveAssetId))
      .limit(1);
    campaignId = caRow[0]?.campaignId ?? null;
  }
  if (!campaignId && hit.slot) {
    campaignId = hit.slot.campaignId;
  }
  if (!campaignId && hit.claim.campaignAssetId) {
    const caRow = await db
      .select({ campaignId: campaignAssets.campaignId })
      .from(campaignAssets)
      .where(eq(campaignAssets.id, hit.claim.campaignAssetId))
      .limit(1);
    campaignId = caRow[0]?.campaignId ?? null;
  }

  const campaignRow = campaignId
    ? await db
        .select({ expiresAt: campaigns.expiresAt })
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1)
    : [];

  const expiry =
    campaignRow[0]?.expiresAt ??
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (!effectiveAssetId) {
    return {
      expiryIso: expiry.toISOString(),
      pending: true,
      files: [],
    };
  }

  const row = await db
    .select({
      ca: campaignAssets,
      campaign: campaigns,
      asset: assets,
    })
    .from(campaignAssets)
    .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
    .leftJoin(assets, eq(campaignAssets.assetId, assets.id))
    .where(eq(campaignAssets.id, effectiveAssetId))
    .limit(1);

  const bundle = row[0];
  if (!bundle) {
    return null;
  }

  let src: string | null = null;
  if (bundle.asset) {
    src = await createSignedReadUrl(bundle.asset.bucket, bundle.asset.objectKey);
  } else if (bundle.ca.assetUrl?.trim()) {
    src = bundle.ca.assetUrl.trim();
  }

  if (!src) {
    return {
      expiryIso: expiry.toISOString(),
      pending: true,
      files: [],
    };
  }

  const mime = bundle.asset?.mimeType ?? "";
  const type: "image" | "audio" = mime.startsWith("audio/")
    ? "audio"
    : "image";

  const filename =
    bundle.asset?.originalFilename ??
    bundle.ca.label?.trim() ??
    "download";

  const title = bundle.ca.label?.trim() || filename;

  const exp =
    bundle.campaign.expiresAt ??
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return {
    expiryIso: exp.toISOString(),
    files: [
      {
        id: bundle.ca.id,
        type,
        src,
        filename,
        title,
      },
    ],
  };
}
