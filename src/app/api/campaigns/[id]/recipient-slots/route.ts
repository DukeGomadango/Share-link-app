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
  recipients,
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
    /** 既存の名簿から選択する場合の受取人 ID */
    recipientId?: string | null;
    /** 新規作成時にグローバル名簿にも登録するか（デフォルト true） */
    createGlobal?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = getDb();

  // --- 名簿連携ロジック ---
  let recipientId: string | null = body.recipientId?.trim() || null;
  let name = body.recipientDisplayName?.trim() || "";

  if (recipientId) {
    // 既存の名簿から選択: 名簿の存在とワークスペース権限を検証
    const [existing] = await db
      .select({ id: recipients.id, name: recipients.name })
      .from(recipients)
      .where(and(eq(recipients.id, recipientId), eq(recipients.workspaceId, session.workspaceId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "not_found", message: "指定された受取人が見つかりません" },
        { status: 404 }
      );
    }
    // 名簿の名前を使用（表示名が空の場合）
    if (!name) name = existing.name;
  } else {
    // 新規作成
    if (!name) {
      return NextResponse.json(
        { error: "invalid_body", message: "recipient_display_name が必要です" },
        { status: 400 }
      );
    }

    // createGlobal が明示的に false でない限り、名簿にも登録
    const createGlobal = body.createGlobal !== false;
    if (createGlobal) {
      const [newRecipient] = await db
        .insert(recipients)
        .values({
          workspaceId: session.workspaceId,
          name,
          tags: [],
          platformId: undefined,
        })
        .returning({ id: recipients.id });
      if (newRecipient) {
        recipientId = newRecipient.id;
      }
    }
  }

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

    return NextResponse.json(
      {
        ok: true,
        claimId: created.claimId,
        slotId: created.slotId,
        claimSecret: created.claimSecret,
        recipientId,
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

