import { and, eq } from "drizzle-orm";
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

type RouteParams = { params: Promise<{ id: string; claimId: string }> };

export async function PATCH(request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId, claimId } = await ctx.params;

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

  // アセットの存在確認
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
    return NextResponse.json(
      { error: "not_found", message: "キャンペーンに紐づくアセットではありません" },
      { status: 404 }
    );
  }

  // Claim の取得
  const rows = await db
    .select({
      claim: claims,
      slot: campaignRecipientSlots,
    })
    .from(claims)
    .leftJoin(campaignRecipientSlots, eq(claims.recipientSlotId, campaignRecipientSlots.id))
    .where(eq(claims.id, claimId))
    .limit(1);

  const hit = rows[0];
  if (!hit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const slotId = hit.slot?.id;

  if (action === "add") {
    try {
      // 中間テーブルに追加
      await db
        .insert(claimAssets)
        .values({ claimId, campaignAssetId: assetId })
        .onConflictDoNothing();

      if (slotId) {
        await db
          .insert(slotAssets)
          .values({ slotId, campaignAssetId: assetId })
          .onConflictDoNothing();

        // スロットのステータスを更新
        await db
          .update(campaignRecipientSlots)
          .set({ status: "ready" })
          .where(eq(campaignRecipientSlots.id, slotId));
      }
    } catch (e) {
      console.error("Assignment failed:", e);
      return NextResponse.json({ error: "assignment_failed", message: String(e) }, { status: 500 });
    }
  } else if (action === "remove") {
    try {
      // 中間テーブルから削除
      await db
        .delete(claimAssets)
        .where(and(eq(claimAssets.claimId, claimId), eq(claimAssets.campaignAssetId, assetId)));

      if (slotId) {
        await db
          .delete(slotAssets)
          .where(and(eq(slotAssets.slotId, slotId), eq(slotAssets.campaignAssetId, assetId)));
        
        // 他にアセットが残っていないか確認
        const remaining = await db
          .select()
          .from(slotAssets)
          .where(eq(slotAssets.slotId, slotId))
          .limit(1);
        
        if (remaining.length === 0) {
          await db
            .update(campaignRecipientSlots)
            .set({ status: "unlinked" })
            .where(eq(campaignRecipientSlots.id, slotId));
        }
      }
    } catch (e) {
      console.error("Removal failed:", e);
      return NextResponse.json({ error: "removal_failed", message: String(e) }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
