import { NextResponse } from "next/server";
import { eq, and, ne, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { 
  claims, 
  claimIdentityLinks, 
  campaigns, 
} from "@/db/schema";

type RouteParams = { params: Promise<{ token: string }> };

/**
 * 現在のトークンに紐づく受取人の「他のギフト（コレクション）」を取得する
 */
export async function GET(_request: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const secret = decodeURIComponent(token).trim();

  if (!secret) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const db = getDb();

  try {
    // 1. 現在のトークンから Identity ID を特定
    const currentLink = await db
      .select({ 
        listenerIdentityId: claimIdentityLinks.listenerIdentityId 
      })
      .from(claims)
      .innerJoin(claimIdentityLinks, eq(claims.id, claimIdentityLinks.claimId))
      .where(eq(claims.claimSecret, secret))
      .limit(1);

    if (!currentLink[0]) {
      // 紐付けがない場合は空リストを返す
      return NextResponse.json({ claims: [] });
    }

    const identityId = currentLink[0].listenerIdentityId;

    // 2. その Identity に紐づく「他の」ギフトを取得
    // ※ 期限切れなどのフィルタリングは一旦せず、全て出す
    const relatedClaims = await db
      .select({
        token: claims.claimSecret,
        campaignName: campaigns.name,
        status: claims.status,
        createdAt: claims.createdAt,
      })
      .from(claimIdentityLinks)
      .innerJoin(claims, eq(claimIdentityLinks.claimId, claims.id))
      .innerJoin(campaigns, eq(claims.campaignId, campaigns.id))
      .where(
        and(
          eq(claimIdentityLinks.listenerIdentityId, identityId),
          ne(claims.claimSecret, secret) // 現在のものは除外
        )
      )
      .orderBy(desc(claims.createdAt));

    return NextResponse.json({ 
      claims: relatedClaims.map(c => ({
        token: c.token,
        name: c.campaignName,
        status: c.status,
        date: c.createdAt.toISOString(),
      }))
    });
  } catch (e) {
    console.error("Failed to fetch related claims:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
