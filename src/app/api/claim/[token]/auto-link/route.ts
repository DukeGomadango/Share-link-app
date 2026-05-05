import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { claims, claimIdentityLinks, listenerIdentities, recipients } from "@/db/schema";
import { LISTENER_SESSION_COOKIE, verifyListenerSessionToken } from "@/lib/webauthn/listener-session-cookie";

type RouteParams = { params: Promise<{ token: string }> };

/**
 * ブラウザのセッション（クッキー）を確認し、リピーターであれば
 * 今回の Claim を既存のアイデンティティに自動的に紐付ける
 */
export async function POST(_request: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const secret = decodeURIComponent(token).trim();

  if (!secret) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  // 1. リスナーセッションの確認
  const cookieStore = await cookies();
  const sessionToken = (await cookieStore).get(LISTENER_SESSION_COOKIE)?.value;
  const session = verifyListenerSessionToken(sessionToken);

  if (!session) {
    // セッションがない（リピーターではない）場合は何もしない
    return NextResponse.json({ ok: false, reason: "no_session" });
  }

  const db = getDb();

  try {
    // 2. Claim の存在確認
    const claimRows = await db
      .select({ id: claims.id })
      .from(claims)
      .where(eq(claims.claimSecret, secret))
      .limit(1);

    const claim = claimRows[0];
    if (!claim) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 3. 自動紐付けを実行 (UPSERT 的な挙動)
    await db
      .insert(claimIdentityLinks)
      .values({
        claimId: claim.id,
        listenerIdentityId: session.listenerIdentityId,
      })
      .onConflictDoNothing();

    // 4. 受取人の名前を取得してお返しする（UX向上用）
    const identityRows = await db
      .select({ 
        name: recipients.name 
      })
      .from(listenerIdentities)
      .leftJoin(recipients, eq(listenerIdentities.linkedRecipientId, recipients.id))
      .where(eq(listenerIdentities.id, session.listenerIdentityId))
      .limit(1);
    
    const detectedName = identityRows[0]?.name ?? null;

    return NextResponse.json({ 
      ok: true, 
      detectedName 
    });
  } catch (e) {
    console.error("Auto-link failed:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
