import { eq, inArray } from "drizzle-orm";
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
  campaignId?: string;
  /** ライバー未割当・ファイルなし（リスナーは待機ポーリング） */
  pending?: boolean;
  /** この claim のトークン（リダイレクト等で使用） */
  claimSecret?: string;
  /** 受取人が一度開封済みかどうか */
  isClaimed?: boolean;
  /** この claim にパスキー（WebAuthn）が紐づいている */
  passkeyLinked?: boolean;
  /** この閲覧に有効な認証セッションがある、またはパブリックである */
  isAuthorized?: boolean;
  /** プレミアム設定により認証が必須である */
  authRequired?: boolean;
  /** 受取人の表示名 */
  displayName?: string;
  files: Array<{
    id: string;
    type: "image" | "audio" | "file";
    src: string;
    filename: string;
    title: string;
  }>;
};

/**
 * 認証状態を考慮して Claim バンドルを取得する
 * @param claimSecret URLに含まれるトークン
 * @param sessionSecret クッキー等から取得した認証済みセッションのシークレット
 */
export async function buildClaimBundleForSecret(
  claimSecret: string,
  sessionSecret?: string
): Promise<ClaimBundleResponse | null> {
  const db = getDb();
  
  // 1. Claim と Campaign の情報を取得
  const base = await db
    .select({
      claimId: claims.id,
      campaignId: campaigns.id,
      campaignName: campaigns.name,
      campaignStatus: campaigns.status,
      expiresAt: campaigns.expiresAt,
      securityLevel: campaigns.securityLevel,
      claimStatus: claims.status,
      slotId: campaignRecipientSlots.id,
      displayName: campaignRecipientSlots.listenerDisplayName,
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

  if (!hit || hit.campaignStatus !== "active") {
    return null;
  }


  const securityLevel = hit.securityLevel as "standard" | "high";
  const isPublic = securityLevel === "standard";
  const isClaimed = hit.claimStatus === "claimed";
  
  // パスキー紐付け状況の確認
  const passkeyRows = await db
    .select({ claimId: claimIdentityLinks.claimId })
    .from(claimIdentityLinks)
    .where(eq(claimIdentityLinks.claimId, hit.claimId))
    .limit(1);
  const passkeyLinked = Boolean(passkeyRows[0]);

  const hasClaimSession = sessionSecret === claimSecret;
  // 公開: リンクのみで閲覧可。限定: 受取 Cookie + パスキー登録済み
  const isAuthorized = isPublic || (hasClaimSession && passkeyLinked);

  // 有効期限チェック
  if (hit.expiresAt && hit.expiresAt < new Date()) {
    // 受け取り済み（パスキー紐付け済み）かつ認証済みであれば、コレクションとして閲覧を許可する
    if (!(passkeyLinked && isAuthorized)) {
      return null;
    }
  }

  // 未認証かつプレミアム設定なら、メタデータのみ返しファイル一覧は隠す
  if (!isAuthorized) {
    return {
      expiryIso: (hit.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).toISOString(),
      campaignName: (hit.campaignName && hit.campaignName.trim() !== "") ? hit.campaignName : "特別な贈り物",
      campaignId: hit.campaignId,
      claimSecret,
      isClaimed,
      passkeyLinked,
      isAuthorized: false,
      authRequired: true,
      displayName: hit.displayName || "ゲスト",
      files: [],
    };
  }

  const claimId = hit.claimId;
  const slotId = hit.slotId;

  // 2. 紐づくアセット ID を収集
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

  const expiry = hit.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // 3. 全アセットの情報を取得して署名 URL を生成
  if (assetIds.length === 0) {
    return {
      expiryIso: expiry.toISOString(),
      campaignName: hit.campaignName || "特別な贈り物",
      campaignId: hit.campaignId,
      pending: true,
      claimSecret,
      isClaimed,
      passkeyLinked,
      isAuthorized: true,
      displayName: hit.displayName || "ゲスト",
      files: [],
    };
  }

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
      // ストレージ保持期限チェック
      if (row.asset.expiresAt && row.asset.expiresAt < new Date()) {
        return null;
      }
      src = await createSignedReadUrl(row.asset.bucket, row.asset.objectKey);
    } else if (row.ca.assetUrl?.trim()) {
      src = row.ca.assetUrl.trim();
    }

    if (!src) return null;

    const mime = row.asset?.mimeType ?? "";
    let type: "image" | "audio" | "file" = "file";
    if (mime.startsWith("audio/")) {
      type = "audio";
    } else if (mime.startsWith("image/")) {
      type = "image";
    }
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

  return {
    expiryIso: expiry.toISOString(),
    campaignName: hit.campaignName || "特別な贈り物",
    campaignId: hit.campaignId,
    passkeyLinked,
    isClaimed,
    isAuthorized: true,
    pending: validFiles.length === 0,
    displayName: hit.displayName || "ゲスト",
    claimSecret,
    files: validFiles,
  };
}
