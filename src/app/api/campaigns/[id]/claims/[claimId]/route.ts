import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { campaigns, claims, campaignRecipientSlots } from "@/db/schema";

type RouteParams = { params: Promise<{ id: string; claimId: string }> };

export async function DELETE(_request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId, claimId } = await ctx.params;
  const db = getDb();

  // 1. 権限確認: キャンペーンが自分のワークスペースのものか
  const camp = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, campaignId),
        eq(campaigns.workspaceId, session.workspaceId)
      )
    )
    .limit(1);

  if (!camp[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 2. Claim の存在確認と Slot ID の取得
  const hit = await db
    .select({ slotId: claims.recipientSlotId })
    .from(claims)
    .where(and(eq(claims.id, claimId), eq(claims.campaignId, campaignId)))
    .limit(1);

  if (!hit[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const slotId = hit[0].slotId;

  try {
    if (slotId) {
      // Slot を削除（Cascade で Claim も削除される設定）
      await db.delete(campaignRecipientSlots).where(eq(campaignRecipientSlots.id, slotId));
    } else {
      // Slot がない場合は直接 Claim を削除
      await db.delete(claims).where(eq(claims.id, claimId));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Recipient deletion failed:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
