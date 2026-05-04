import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import {
  campaignRecipientSlots,
  campaigns,
  claims,
  listenerIdentities,
  recipients,
  slotAssets,
  claimAssets,
} from "@/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * 2つの受取人スロットを統合する。
 * sourceSlotId (主に待機室から入室したばかりの空の枠) を
 * targetSlotId (主に事前準備してファイルが紐付いている枠) に統合する。
 */
export async function POST(request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await ctx.params;

  let body: {
    sourceSlotId: string;
    targetSlotId: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sourceSlotId, targetSlotId } = body;
  if (!sourceSlotId || !targetSlotId || sourceSlotId === targetSlotId) {
    return NextResponse.json({ error: "Invalid slot IDs" }, { status: 400 });
  }

  const db = getDb();

  console.log(`[Merge] Starting merge: ${sourceSlotId} -> ${targetSlotId} (Campaign: ${campaignId})`);

  // 両方のスロットが存在し、かつキャンペーンに属しているか確認
  const slots = await db
    .select({
      id: campaignRecipientSlots.id,
      campaignId: campaignRecipientSlots.campaignId,
      recipientId: campaignRecipientSlots.recipientId,
    })
    .from(campaignRecipientSlots)
    .where(inArray(campaignRecipientSlots.id, [sourceSlotId, targetSlotId]));
  
  if (slots.length < 2) {
    console.error(`[Merge] One or more slots not found. Found: ${slots.length}`);
    return NextResponse.json({ error: "One or more slots not found" }, { status: 404 });
  }

  const allInSameCampaign = slots.every(s => s.campaignId === campaignId);
  if (!allInSameCampaign) {
    console.error(`[Merge] Slots belong to different campaigns`);
    return NextResponse.json({ error: "Invalid campaign context" }, { status: 400 });
  }

  // キャンペーンの所有権確認
  const owned = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(
      and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, session.workspaceId))
    )
    .limit(1);

  if (!owned[0]) {
    console.error(`[Merge] Workspace does not own this campaign`);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await db.transaction(async (tx) => {
      // 1. 両方のスロットから現在のアセットを取得
      const [sourceAssets, targetAssets] = await Promise.all([
        tx.select({ id: slotAssets.campaignAssetId }).from(slotAssets).where(eq(slotAssets.slotId, sourceSlotId)),
        tx.select({ id: slotAssets.campaignAssetId }).from(slotAssets).where(eq(slotAssets.slotId, targetSlotId)),
      ]);

      const combinedAssetIds = new Set([
        ...sourceAssets.map(a => a.id),
        ...targetAssets.map(a => a.id),
      ]);

      console.log(`[Merge] Combining assets: Source(${sourceAssets.length}) + Target(${targetAssets.length}) = Total(${combinedAssetIds.size})`);

      // 2. 統合先にアセットをすべて紐付ける
      if (combinedAssetIds.size > 0) {
        await tx
          .insert(slotAssets)
          .values(Array.from(combinedAssetIds).map(aid => ({
            slotId: targetSlotId,
            campaignAssetId: aid,
          })))
          .onConflictDoNothing();
      }

      // 3. sourceSlotId に紐付いている claims を targetSlotId に付け替える
      const movedClaims = await tx
        .update(claims)
        .set({ recipientSlotId: targetSlotId })
        .where(eq(claims.recipientSlotId, sourceSlotId))
        .returning({ id: claims.id });
      
      console.log(`[Merge] Moved ${movedClaims.length} claims to target slot`);

      // 4. この枠に紐付いている「すべての」Claim（以前からいた人 + 新しく来た人）に全アセットを紐付ける
      const allClaimsInTarget = await tx
        .select({ id: claims.id })
        .from(claims)
        .where(eq(claims.recipientSlotId, targetSlotId));

      if (allClaimsInTarget.length > 0 && combinedAssetIds.size > 0) {
        const claimAssetValues = [];
        for (const claim of allClaimsInTarget) {
          for (const aid of combinedAssetIds) {
            claimAssetValues.push({
              claimId: claim.id,
              campaignAssetId: aid,
            });
          }
        }
        await tx
          .insert(claimAssets)
          .values(claimAssetValues)
          .onConflictDoNothing();
        console.log(`[Merge] Linked ${combinedAssetIds.size} assets to ${allClaimsInTarget.length} claims`);
      }

      // 5. sourceSlotId を削除する
      const deleted = await tx
        .delete(campaignRecipientSlots)
        .where(eq(campaignRecipientSlots.id, sourceSlotId))
        .returning({ id: campaignRecipientSlots.id });
      
      console.log(`[Merge] Deleted source slot: ${deleted[0]?.id}`);
      
      // 6. targetSlotId のステータスを更新
      if (combinedAssetIds.size > 0) {
        await tx
          .update(campaignRecipientSlots)
          .set({ status: "ready" })
          .where(eq(campaignRecipientSlots.id, targetSlotId));
      }

      // 7. 名簿側の統合: listener_identities の紐付けを統合先に付け替え
      const sourceSlot = slots.find(s => s.id === sourceSlotId);
      const targetSlot = slots.find(s => s.id === targetSlotId);
      const sourceRecipientId = sourceSlot?.recipientId;
      const targetRecipientId = targetSlot?.recipientId;

      if (sourceRecipientId && targetRecipientId && sourceRecipientId !== targetRecipientId) {
        // ソース側の名簿に紐付いた listener_identities を統合先に付け替え
        await tx
          .update(listenerIdentities)
          .set({ linkedRecipientId: targetRecipientId })
          .where(eq(listenerIdentities.linkedRecipientId, sourceRecipientId));

        // ソース側の名簿レコードを削除（統合先に集約）
        await tx
          .delete(recipients)
          .where(eq(recipients.id, sourceRecipientId));

        console.log(`[Merge] Merged global recipient ${sourceRecipientId} -> ${targetRecipientId}`);
      } else if (sourceRecipientId && !targetRecipientId) {
        // ソースにだけ名簿がある場合、統合先スロットにソースの名簿IDを引き継ぐ
        await tx
          .update(campaignRecipientSlots)
          .set({ recipientId: sourceRecipientId })
          .where(eq(campaignRecipientSlots.id, targetSlotId));

        console.log(`[Merge] Inherited recipient ${sourceRecipientId} to target slot`);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Merge] Transaction failed:", e);
    return NextResponse.json({ error: "Merge failed", detail: String(e) }, { status: 500 });
  }
}
