import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { campaigns, campaignRecipientSlots } from "@/db/schema";

type RouteParams = { params: Promise<{ id: string; slotId: string }> };

export async function DELETE(_request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId, slotId } = await ctx.params;
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

  // 2. Slot の存在確認
  const hit = await db
    .select({ id: campaignRecipientSlots.id })
    .from(campaignRecipientSlots)
    .where(and(eq(campaignRecipientSlots.id, slotId), eq(campaignRecipientSlots.campaignId, campaignId)))
    .limit(1);

  if (!hit[0]) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  try {
    // Slot を削除（Cascade で紐づく Claim や Assets も削除される）
    await db.delete(campaignRecipientSlots).where(eq(campaignRecipientSlots.id, slotId));
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Recipient slot deletion failed:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
