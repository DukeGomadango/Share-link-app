import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { claims } from "@/db/schema";

type RouteParams = { params: Promise<{ token: string }> };

/**
 * 個別トークンに基づいて Claim を「受取済み(claimed)」に更新する
 */
export async function POST(_request: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const secret = decodeURIComponent(token).trim();
  
  if (!secret) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
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
    console.error("Failed to mark claim as claimed:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
