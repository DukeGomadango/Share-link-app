import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { 
  claims, 
  campaigns, 
  claimIdentityLinks, 
  claimAssets, 
  campaignAssets, 
  assets, 
  listenerIdentities, 
  campaignRecipientSlots 
} from "@/db/schema";
import { eq, desc, or, inArray } from "drizzle-orm";
import { verifyListenerSessionToken, LISTENER_SESSION_COOKIE } from "@/lib/webauthn/listener-session-cookie";
import { createSignedReadUrl } from "@/lib/assets/signed-urls";

export const dynamic = "force-dynamic";

type ListenerCampaignEntry = {
  id: string;
  name: string;
  expiresAt: Date | null;
  claims: Array<{ id: string; token: string; createdAt: Date; isUnread: boolean }>;
  previews: Array<{ name: string; mimeType: string; url: string }>;
  isUnread: boolean;
};

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(LISTENER_SESSION_COOKIE)?.value;
    const payload = verifyListenerSessionToken(sessionToken);
    
    if (!payload || !payload.listenerIdentityId) {
      return NextResponse.json({ campaigns: [] });
    }

    const identityId = payload.listenerIdentityId;
    const db = getDb();

    // 1. リスナー自身のアイデンティティ情報を取得
    const identityRow = await db
      .select({ linkedRecipientId: listenerIdentities.linkedRecipientId })
      .from(listenerIdentities)
      .where(eq(listenerIdentities.id, identityId))
      .limit(1);
    
    const linkedRecipientId = identityRow[0]?.linkedRecipientId;

    // 2. コレクション対象の Claim を取得
    const allClaims = await db
      .select({
        claimId: claims.id,
        claimToken: claims.claimSecret,
        claimCreatedAt: claims.createdAt,
        campaignId: campaigns.id,
        campaignName: campaigns.name,
        campaignExpiry: campaigns.expiresAt,
        isExplicitlyLinked: claimIdentityLinks.claimId, // IDがあれば紐付け済み
      })
      .from(claims)
      .innerJoin(campaigns, eq(claims.campaignId, campaigns.id))
      .leftJoin(claimIdentityLinks, eq(claims.id, claimIdentityLinks.claimId))
      .leftJoin(campaignRecipientSlots, eq(claims.recipientSlotId, campaignRecipientSlots.id))
      .where(
        or(
          eq(claimIdentityLinks.listenerIdentityId, identityId),
          linkedRecipientId ? eq(campaignRecipientSlots.recipientId, linkedRecipientId) : undefined
        )
      )
      .orderBy(desc(claims.createdAt));

    if (allClaims.length === 0) {
      return NextResponse.json({ campaigns: [] });
    }

    // 3. キャンペーンごとにグルーピング
    const campaignMap = new Map<string, ListenerCampaignEntry>();
    const claimIds: string[] = [];
    const campaignIdByClaimId = new Map<string, string>();

    for (const c of allClaims) {
      claimIds.push(c.claimId);
      campaignIdByClaimId.set(c.claimId, c.campaignId);
      if (!campaignMap.has(c.campaignId)) {
        campaignMap.set(c.campaignId, {
          id: c.campaignId,
          name: c.campaignName,
          expiresAt: c.campaignExpiry,
          claims: [],
          previews: [],
          isUnread: false, // 初期値
        });
      }

      const campData = campaignMap.get(c.campaignId);
      if (!campData) continue;
      
      const isUnread = !c.isExplicitlyLinked;
      if (isUnread) {
        campData.isUnread = true;
      }

      campData.claims.push({
        id: c.claimId,
        token: c.claimToken,
        createdAt: c.claimCreatedAt,
        isUnread,
      });
    }

    // 4. アセットプレビューの取得
    if (claimIds.length > 0) {
      const assetPreviews = await db
        .select({
          claimId: claimAssets.claimId,
          assetName: assets.originalFilename,
          mimeType: assets.mimeType,
          bucket: assets.bucket,
          objectKey: assets.objectKey,
        })
        .from(claimAssets)
        .innerJoin(campaignAssets, eq(claimAssets.campaignAssetId, campaignAssets.id))
        .innerJoin(assets, eq(campaignAssets.assetId, assets.id))
        .where(inArray(claimAssets.claimId, claimIds))
        .limit(100);

      const previewWithUrls = await Promise.all(
        assetPreviews.slice(0, 30).map(async (p) => {
          let url: string | null = null;
          if (p.mimeType.startsWith("image/")) {
            url = await createSignedReadUrl(p.bucket, p.objectKey);
          }
          return { ...p, url };
        })
      );

      for (const p of previewWithUrls) {
        const campaignId = campaignIdByClaimId.get(p.claimId);
        if (!campaignId || !p.url) continue;
        const campData = campaignMap.get(campaignId);
        if (campData && campData.previews.length < 3) {
          campData.previews.push({
            name: p.assetName,
            mimeType: p.mimeType,
            url: p.url
          });
        }
      }
    }

    const result = Array.from(campaignMap.values());
    
    return NextResponse.json({ 
      campaigns: result,
      identityId 
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
