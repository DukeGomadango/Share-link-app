import { eq } from "drizzle-orm";

import { createSignedReadUrl } from "@/lib/assets/signed-urls";
import { getDb } from "@/db";
import { assets, campaignAssets, campaigns, claims } from "@/db/schema";

export type ClaimBundleResponse = {
  expiryIso: string;
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
  const row = await db
    .select({
      claim: claims,
      ca: campaignAssets,
      campaign: campaigns,
      asset: assets,
    })
    .from(claims)
    .innerJoin(campaignAssets, eq(claims.campaignAssetId, campaignAssets.id))
    .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
    .leftJoin(assets, eq(campaignAssets.assetId, assets.id))
    .where(eq(claims.claimSecret, claimSecret))
    .limit(1);

  const hit = row[0];
  if (!hit) {
    return null;
  }

  let src: string | null = null;
  if (hit.asset) {
    src = await createSignedReadUrl(hit.asset.bucket, hit.asset.objectKey);
  } else if (hit.ca.assetUrl?.trim()) {
    src = hit.ca.assetUrl.trim();
  }

  if (!src) {
    return null;
  }

  const mime = hit.asset?.mimeType ?? "";
  const type: "image" | "audio" = mime.startsWith("audio/")
    ? "audio"
    : "image";

  const filename =
    hit.asset?.originalFilename ??
    hit.ca.label?.trim() ??
    "download";

  const title = hit.ca.label?.trim() || filename;

  const expiry =
    hit.campaign.expiresAt ??
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return {
    expiryIso: expiry.toISOString(),
    files: [
      {
        id: hit.ca.id,
        type,
        src,
        filename,
        title,
      },
    ],
  };
}
