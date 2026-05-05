import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { claims } from "@/db/schema";
import { claimSessionCookieName } from "@/lib/claims/constants";

/**
 * セッションクッキーに基づいて、現在の Claim を「受取済み(claimed)」に更新する
 * 共通受付（チェックイン）フローで使用
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId")?.trim();

  if (!campaignId) {
    return NextResponse.json({ error: "campaign_id_required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const secret = (await cookieStore).get(claimSessionCookieName(campaignId))?.value?.trim();

  if (!secret) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const db = getDb();

  try {
    const updated = await db
      .update(claims)
      .set({ 
        status: "claimed",
        updatedAt: new Date() 
      })
      .where(eq(claims.claimSecret, secret))
      .returning({ id: claims.id });

    if (!updated[0]) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to mark session claim as claimed:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
