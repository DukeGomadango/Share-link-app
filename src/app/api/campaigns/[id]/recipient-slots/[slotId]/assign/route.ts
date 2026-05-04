import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import {
  campaignAssets,
  campaignRecipientSlots,
  campaigns,
  claimAssets,
  claims,
  slotAssets,
} from "@/db/schema";

type RouteParams = { params: Promise<{ id: string; slotId: string }> };

export async function PATCH(request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId, slotId } = await ctx.params;

  let body: { campaignAssetId?: string; action?: "add" | "remove" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const assetId = body.campaignAssetId?.trim();
  const action = body.action ?? "add";

  if (!assetId) {
    return NextResponse.json(
      { error: "invalid_body", message: "campaign_asset_id が必要です" },
      { status: 400 }
    );
  }

  const db = getDb();

  // 1. 権限とアセットの存在確認
  const targetAsset = await db
    .select({ id: campaignAssets.id })
    .from(campaignAssets)
    .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
    .where(
      and(
        eq(campaignAssets.id, assetId),
        eq(campaignAssets.campaignId, campaignId),
        eq(campaigns.workspaceId, session.workspaceId)
      )
    )
    .limit(1);

  if (!targetAsset[0]) {
    return NextResponse.json({ error: "Asset not found or unauthorized" }, { status: 404 });
  }

  // 2. Slot の存在確認
  const slot = await db
    .select()
    .from(campaignRecipientSlots)
    .where(and(eq(campaignRecipientSlots.id, slotId), eq(campaignRecipientSlots.campaignId, campaignId)))
    .limit(1);
  
  if (!slot[0]) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  // 3. この Slot に紐付いている全 Claim を取得 (一括反映のため)
  const linkedClaims = await db
    .select({ id: claims.id })
    .from(claims)
    .where(eq(claims.recipientSlotId, slotId));

  try {
    await db.transaction(async (tx) => {
      if (action === "add") {
        // Slot への紐付け
        await tx
          .insert(slotAssets)
          .values({ slotId, campaignAssetId: assetId })
          .onConflictDoNothing();

        // 紐付いている全 Claim への紐付け
        if (linkedClaims.length > 0) {
          await tx
            .insert(claimAssets)
            .values(linkedClaims.map(c => ({
              claimId: c.id,
              campaignAssetId: assetId
            })))
            .onConflictDoNothing();
        }

        // ステータスを準備完了に
        await tx
          .update(campaignRecipientSlots)
          .set({ status: "ready" })
          .where(eq(campaignRecipientSlots.id, slotId));

      } else {
        // 削除処理
        await tx
          .delete(slotAssets)
          .where(and(eq(slotAssets.slotId, slotId), eq(slotAssets.campaignAssetId, assetId)));
        
        if (linkedClaims.length > 0) {
          await tx
            .delete(claimAssets)
            .where(and(
              inArray(claimAssets.claimId, linkedClaims.map(c => c.id)),
              eq(claimAssets.campaignAssetId, assetId)
            ));
        }

        // 他にアセットが残っていないか確認
        const remaining = await tx
          .select()
          .from(slotAssets)
          .where(eq(slotAssets.slotId, slotId))
          .limit(1);
        
        if (remaining.length === 0) {
          await tx
            .update(campaignRecipientSlots)
            .set({ status: "unlinked" })
            .where(eq(campaignRecipientSlots.id, slotId));
        }
      }

      // 4. 重要: リアルタイム通知を飛ばすために、紐付いている全 Claim の updatedAt を更新する
      if (linkedClaims.length > 0) {
        await tx
          .update(claims)
          .set({ updatedAt: new Date() })
          .where(inArray(claims.id, linkedClaims.map(c => c.id)));
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Assignment failed:", e);
    return NextResponse.json({ error: "assignment_failed", detail: String(e) }, { status: 500 });
  }
}
