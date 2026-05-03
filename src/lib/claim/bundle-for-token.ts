import { and, eq, inArray } from "drizzle-orm";
import { createSignedReadUrl } from "@/lib/assets/signed-urls";
import { getDb } from "@/db";
import {
  assets,
  campaignAssets,
  campaignRecipientSlots,
  campaigns,
  claimAssets,
  claimIdentityLinks,
  claims,
  slotAssets,
} from "@/db/schema";

export type ClaimBundleResponse = {
  expiryIso: string;
  campaignName: string;
  /** ライバー未割当・ファイルなし（リスナーは待機ポーリング） */
  pending?: boolean;
  /** この claim にパスキー（WebAuthn）が紐づいている */
  passkeyLinked?: boolean;
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
  
  // 1. Claim と Campaign, (あれば) Slot の情報を取得
  const base = await db
    .select({
      claim: { 
        id: claims.id,
      },
      campaign: {
        name: campaigns.name,
        status: campaigns.status,
        expiresAt: campaigns.expiresAt,
      },
      slot: {
        id: campaignRecipientSlots.id,
      },
    })
    .from(claims)
    .innerJoin(campaigns, eq(claims.campaignId, campaigns.id))
    .leftJoin(
      campaignRecipientSlots,
      eq(claims.recipientSlotId, campaignRecipientSlots.id)
    )
    .where(eq(claims.claimSecret, claimSecret))
    .limit(1);

  const hit = base[0];
  if (!hit || hit.campaign.status !== "active") {
    return null;
  }

  const claimId = hit.claim.id;
  const slotId = hit.slot?.id;

  // 2. 紐づくアセット ID を収集 (Claim 優先、なければ Slot)
  const [cAssets, sAssets] = await Promise.all([
    db.select().from(claimAssets).where(eq(claimAssets.claimId, claimId)),
    slotId
      ? db.select().from(slotAssets).where(eq(slotAssets.slotId, slotId))
      : Promise.resolve([]),
  ]);

  const assetIds = Array.from(new Set([
    ...cAssets.map(a => a.campaignAssetId),
    ...sAssets.map(a => a.campaignAssetId),
  ]));

  const expiry = hit.campaign.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const passkeyRows = await db
    .select({ claimId: claimIdentityLinks.claimId })
    .from(claimIdentityLinks)
    .where(eq(claimIdentityLinks.claimId, claimId))
    .limit(1);
  const passkeyLinked = Boolean(passkeyRows[0]);

  if (assetIds.length === 0) {
    return {
      expiryIso: expiry.toISOString(),
      campaignName: hit.campaign.name || "特別な贈り物",
      pending: true,
      passkeyLinked,
      files: [],
    };
  }

  // 3. 全アセットの情報を取得して署名 URL を生成
  const assetRows = await db
    .select({
      ca: campaignAssets,
      asset: assets,
    })
    .from(campaignAssets)
    .leftJoin(assets, eq(campaignAssets.assetId, assets.id))
    .where(inArray(campaignAssets.id, assetIds));

  const files = await Promise.all(assetRows.map(async (row) => {
    let src: string | null = null;
    if (row.asset) {
      src = await createSignedReadUrl(row.asset.bucket, row.asset.objectKey);
    } else if (row.ca.assetUrl?.trim()) {
      src = row.ca.assetUrl.trim();
    }

    if (!src) return null;

    const mime = row.asset?.mimeType ?? "";
    const type: "image" | "audio" = mime.startsWith("audio/") ? "audio" : "image";
    const filename = row.asset?.originalFilename ?? row.ca.label?.trim() ?? "download";
    const title = row.ca.label?.trim() || filename;

    return {
      id: row.ca.id,
      type,
      src,
      filename,
      title,
    };
  }));

  const validFiles = files.filter((f): f is Exclude<typeof f, null> => !!f);

  const bundle = {
    expiryIso: expiry.toISOString(),
    campaignName: hit.campaign.name || "特別な贈り物",
    passkeyLinked,
    pending: validFiles.length === 0,
    files: validFiles,
  };
  
  return bundle;
}
