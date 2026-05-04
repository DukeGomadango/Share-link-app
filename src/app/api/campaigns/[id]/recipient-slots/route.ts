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
  claims,
  slotAssets,
} from "@/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await ctx.params;

  let body: {
    campaignAssetId?: string | null;
    campaignAssetIds?: string[];
    recipientDisplayName?: string;
    listenerNote?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.recipientDisplayName?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "invalid_body", message: "recipient_display_name が必要です" },
      { status: 400 }
    );
  }

  const db = getDb();
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

  // 複数のアセット ID を正規化
  const assetIds = Array.from(new Set([
    ...(body.campaignAssetId ? [body.campaignAssetId.trim()] : []),
    ...(body.campaignAssetIds || [])
  ])).filter(Boolean);

  // 全て有効なキャンペーンアセットか確認
  if (assetIds.length > 0) {
    const rows = await db
      .select({ id: campaignAssets.id })
      .from(campaignAssets)
      .where(
        and(inArray(campaignAssets.id, assetIds), eq(campaignAssets.campaignId, campaignId))
      );
    
    if (rows.length !== assetIds.length) {
      return NextResponse.json(
        { error: "not_found", message: "一部のアセットがキャンペーンに紐づいていないか見つかりません" },
        { status: 404 }
      );
    }
  }

  try {
    const created = await createSlotAndClaim({
      campaignId,
      listenerDisplayName: name,
      listenerNote: body.listenerNote ?? null,
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

    return NextResponse.json(
      {
        ok: true,
        claimId: created.claimId,
        slotId: created.slotId,
        claimSecret: created.claimSecret,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "create_failed", message: "受取枠の作成に失敗しました" },
      { status: 500 }
    );
  }
}
