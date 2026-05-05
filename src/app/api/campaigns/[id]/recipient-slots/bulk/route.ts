import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { createSlotAndClaim } from "@/lib/claims/create-slot-and-claim";
import { getDb } from "@/db";
import {
  campaignAssets,
  campaignRecipientSlots,
  campaigns,
  claimAssets,
  recipients,
  slotAssets,
} from "@/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

/** 一度に一括追加できる最大件数 */
const MAX_BULK_NAMES = 200;

export async function POST(request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await ctx.params;
  const db = getDb();

  // キャンペーンの所有権確認
  const owned = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(
      and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, session.workspaceId))
    )
    .limit(1);

  if (!owned[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: {
    names: string[];
    campaignAssetIds?: string[];
    listenerNote?: string | null;
    createGlobal?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { names, campaignAssetIds = [], listenerNote = null, createGlobal = true } = body;

  if (!names || !Array.isArray(names) || names.length === 0) {
    return NextResponse.json({ error: "Invalid names", message: "名前リストが必要です" }, { status: 400 });
  }

  if (names.length > MAX_BULK_NAMES) {
    return NextResponse.json(
      { error: "too_many_names", message: `一度に追加できるのは ${MAX_BULK_NAMES} 件までです` },
      { status: 400 }
    );
  }

  // アセットの妥当性確認
  const assetIds = (campaignAssetIds || []).filter(Boolean);
  if (assetIds.length > 0) {
    const rows = await db
      .select({ id: campaignAssets.id })
      .from(campaignAssets)
      .where(
        and(inArray(campaignAssets.id, assetIds), eq(campaignAssets.campaignId, campaignId))
      );
    
    if (rows.length !== assetIds.length) {
      return NextResponse.json(
        { error: "invalid_assets", message: "一部のアセットが見つかりません" },
        { status: 400 }
      );
    }
  }

  const results = [];

  // トランザクションを使わず、1件ずつ処理（途中で失敗してもそれまでの分は残る仕様とする）
  for (const name of names) {
    const trimmedName = name.trim();
    if (!trimmedName) continue;

    try {
      let recipientId: string | null = null;
      if (createGlobal) {
        // グローバル名簿にも登録
        const [newRecipient] = await db
          .insert(recipients)
          .values({
            workspaceId: session.workspaceId,
            name: trimmedName,
            tags: [],
          })
          .returning({ id: recipients.id });
        if (newRecipient) {
          recipientId = newRecipient.id;
        }
      }

      const created = await createSlotAndClaim({
        campaignId,
        listenerDisplayName: trimmedName,
        listenerNote: listenerNote || null,
        recipientId,
      });

      if (assetIds.length > 0) {
        // Slot への紐付け
        await db
          .insert(slotAssets)
          .values(assetIds.map(id => ({
            slotId: created.slotId,
            campaignAssetId: id,
          })))
          .onConflictDoNothing();

        // Claim への紐付け
        await db
          .insert(claimAssets)
          .values(assetIds.map(id => ({
            claimId: created.claimId,
            campaignAssetId: id,
          })))
          .onConflictDoNothing();

        await db
          .update(campaignRecipientSlots)
          .set({ status: "ready" })
          .where(eq(campaignRecipientSlots.id, created.slotId));
      }

      results.push({ name: trimmedName, ok: true });
    } catch (e) {
      console.error(`Bulk create failed for ${trimmedName}:`, e);
      results.push({ name: trimmedName, ok: false, error: String(e) });
    }
  }

  return NextResponse.json({ 
    ok: true, 
    results, 
    addedCount: results.filter(r => r.ok).length 
  });
}
