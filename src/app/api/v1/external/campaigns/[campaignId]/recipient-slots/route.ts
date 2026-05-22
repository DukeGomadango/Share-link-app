import { and, eq } from "drizzle-orm";

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
import { createSlotAndClaim } from "@/lib/claims/create-slot-and-claim";
import { recomputeSlotAssetsFromClaims } from "@/lib/claims/recompute-slot-assets";
import { resolveIntegrationBearer } from "@/lib/external-auth";
import { ensureCampaignToolIntegrationWritable } from "@/lib/external-integration-pause";
import { handleCorsPreflight, jsonWithCors } from "@/lib/external-cors";
import {
  getCachedJsonResponse,
  putCachedJsonResponse,
} from "@/lib/external-idempotency";
import { publicBaseUrlFromRequest } from "@/lib/public-base-url";

type RouteParams = { params: Promise<{ campaignId: string }> };

const ROUTE_KEY = "POST /api/v1/external/campaigns/:id/recipient-slots";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

/**
 * 冪等キーで配布リンクの有無を確認する（ツールのリンク切れ検知用）。
 * Query: ?external_transaction_id=...
 */
export async function GET(request: Request, ctx: RouteParams) {
  const auth = await resolveIntegrationBearer(request, "claims:issue");
  if (auth instanceof Response) return auth;

  const { campaignId } = await ctx.params;
  const externalTxId = new URL(request.url).searchParams
    .get("external_transaction_id")
    ?.trim();

  if (!externalTxId) {
    return jsonWithCors(
      { error: "missing_parameter", message: "external_transaction_id が必要です" },
      request,
      { status: 400 }
    );
  }

  const db = getDb();
  const [row] = await db
    .select({
      claimSecret: claims.claimSecret,
      claimId: claims.id,
      slotId: claims.recipientSlotId,
      slotCampaignId: campaignRecipientSlots.campaignId,
      recipientId: campaignRecipientSlots.recipientId,
    })
    .from(claims)
    .leftJoin(
      campaignRecipientSlots,
      eq(claims.recipientSlotId, campaignRecipientSlots.id)
    )
    .where(eq(claims.externalTransactionId, externalTxId))
    .limit(1);

  if (!row?.slotId || row.slotCampaignId !== campaignId) {
    return jsonWithCors({ ok: true, linked: false }, request);
  }

  const base = publicBaseUrlFromRequest(request);
  return jsonWithCors(
    {
      ok: true,
      linked: true,
      claim_url: `${base}/claim/${encodeURIComponent(row.claimSecret)}`,
      claim_id: row.claimId,
      slot_id: row.slotId,
      recipient_id: row.recipientId,
      external_transaction_id: externalTxId,
    },
    request
  );
}

/**
 * 外部アプリから受取人スロットを削除する。
 * Query: ?external_transaction_id=...
 */
export async function DELETE(request: Request, ctx: RouteParams) {
  const auth = await resolveIntegrationBearer(request, "claims:issue");
  if (auth instanceof Response) return auth;

  const { campaignId } = await ctx.params;
  const url = new URL(request.url);
  const externalTxId = url.searchParams.get("external_transaction_id");

  if (!externalTxId) {
    return jsonWithCors({ error: "missing_parameter", message: "external_transaction_id が必要です" }, request, { status: 400 });
  }

  const db = getDb();
  
  // キャンペーン所有権の確認
  const camp = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, auth.workspaceId)))
    .limit(1);

  if (!camp[0]) {
    return jsonWithCors({ error: "not_found", message: "キャンペーンが見つかりません" }, request, { status: 404 });
  }

  const pauseBlock = await ensureCampaignToolIntegrationWritable(
    campaignId,
    auth.workspaceId,
    request
  );
  if (pauseBlock) return pauseBlock;

  // スロットの特定と削除 (cascade により claim 等も消える想定)
  // schemaを確認し、必要なら手動で消す
  const result = await db.delete(claims).where(eq(claims.externalTransactionId, externalTxId)).returning({ id: claims.id, slotId: claims.recipientSlotId });
  
  if (result.length > 0 && result[0] && result[0].slotId) {
    await db.delete(campaignRecipientSlots).where(eq(campaignRecipientSlots.id, result[0].slotId));
  }

  return jsonWithCors({ ok: true, deleted_count: result.length }, request);
}

/**
 * ガチャ等の外部アプリから呼び出し、キャンペーンに受取人スロット（名簿枠）を作成する。
 * キャンペーンに紐づく全アセットを自動でClaimに割り当てる。
 *
 * Body: { listener_display_name, external_transaction_id, campaign_asset_ids?, recipient_id? }
 * - campaign_asset_ids 省略: キャンペーン全アセット（レガシー・非推奨）
 * - campaign_asset_ids []: ファイル0件（だんごツールの当選ベース同期）
 * - campaign_asset_ids [id,...]: 指定アセットのみ
 * 冪等: 同じ external_transaction_id が既に存在すれば既存の claim_url を返す。
 */
export async function POST(request: Request, ctx: RouteParams) {
  // ── 認証 ──
  const auth = await resolveIntegrationBearer(request, "claims:issue");
  if (auth instanceof Response) {
    return auth;
  }

  const { campaignId } = await ctx.params;
  const idemHeader =
    request.headers.get("Idempotency-Key") ??
    request.headers.get("idempotency-key");

  const cached = await getCachedJsonResponse(
    auth.integrationTokenId,
    ROUTE_KEY,
    idemHeader
  );
  if (cached !== null) {
    return jsonWithCors(cached, request);
  }
  // ── Body パース ──
  let body: {
    listener_display_name?: unknown;
    external_transaction_id?: unknown;
    campaign_asset_ids?: unknown;
    listener_note?: unknown;
    recipient_id?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ error: "invalid_json" }, request, { status: 400 });
  }

  const listenerName =
    typeof body.listener_display_name === "string"
      ? body.listener_display_name.trim()
      : "";
  const externalTxId =
    typeof body.external_transaction_id === "string"
      ? body.external_transaction_id.trim()
      : "";
  const requestedAssetIds = Array.isArray(body.campaign_asset_ids)
    ? (body.campaign_asset_ids.filter((id) => typeof id === "string") as string[])
    : null;
  const listenerNote =
    typeof body.listener_note === "string" ? body.listener_note.trim() : "";

  if (!listenerName) {
    return jsonWithCors(
      {
        error: "invalid_body",
        message: "listener_display_name が必要です",
      },
      request,
      { status: 400 }
    );
  }
  if (!externalTxId) {
    return jsonWithCors(
      {
        error: "invalid_body",
        message: "external_transaction_id が必要です",
      },
      request,
      { status: 400 }
    );
  }

  const requestedRecipientId =
    typeof body.recipient_id === "string" ? body.recipient_id.trim() : "";

  // ── キャンペーン所有権の確認 ──
  const db = getDb();
  const camp = await db
    .select({
      id: campaigns.id,
      securityLevel: campaigns.securityLevel,
      distributionMode: campaigns.distributionMode,
      isExternalLinked: campaigns.isExternalLinked,
      status: campaigns.status,
    })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, campaignId),
        eq(campaigns.workspaceId, auth.workspaceId)
      )
    )
    .limit(1);

  if (!camp[0]) {
    return jsonWithCors(
      { error: "not_found", message: "キャンペーンが見つかりません" },
      request,
      { status: 404 }
    );
  }

  let validatedRecipientId: string | null = null;
  if (requestedRecipientId) {
    const [registryRow] = await db
      .select({ id: recipients.id })
      .from(recipients)
      .where(
        and(
          eq(recipients.id, requestedRecipientId),
          eq(recipients.workspaceId, auth.workspaceId)
        )
      )
      .limit(1);
    if (!registryRow) {
      return jsonWithCors(
        { error: "not_found", message: "指定された受取人名簿が見つかりません" },
        request,
        { status: 404 }
      );
    }
    validatedRecipientId = registryRow.id;
  }

  const pauseBlock = await ensureCampaignToolIntegrationWritable(
    campaignId,
    auth.workspaceId,
    request
  );
  if (pauseBlock) return pauseBlock;

  // ツール連携が有効なキャンペーンは配布前提のモードに揃える（一時停止中は上で 403）
  if (
    camp[0].distributionMode !== "per_link" ||
    camp[0].securityLevel !== "high" ||
    camp[0].status !== "active"
  ) {
    await db
      .update(campaigns)
      .set({
        distributionMode: "per_link",
        securityLevel: "high",
        status: "active",
      })
      .where(eq(campaigns.id, campaignId));
  }

  // ── キャンペーンのアセット取得 ──
  const allAssetRows = await db
    .select({ id: campaignAssets.id, assetId: campaignAssets.assetId })
    .from(campaignAssets)
    .where(eq(campaignAssets.campaignId, campaignId));

  // 配布対象アセットの選定
  let assetsToLink = allAssetRows;
  if (requestedAssetIds !== null) {
    const idSet = new Set(requestedAssetIds.map(id => id.toLowerCase()));
    assetsToLink = allAssetRows.filter((a) => {
      const match = idSet.has(a.id.toLowerCase()) || (a.assetId && idSet.has(a.assetId.toLowerCase()));
      return match;
    });
  }

  // ── 冪等: 同じ externalTransactionId の Claim が既に存在するか ──
  const base = publicBaseUrlFromRequest(request);

    const [existingClaim] = await db
    .select({
      claimSecret: claims.claimSecret,
      id: claims.id,
      recipientSlotId: claims.recipientSlotId,
    })
    .from(claims)
    .where(eq(claims.externalTransactionId, externalTxId))
    .limit(1);

  if (existingClaim) {
    const claimId = existingClaim.id;
    const slotId = existingClaim.recipientSlotId;

    // 表示名は毎回ツール側のプレイヤー名に追随（リネーム同期）
    if (slotId) {
      await db
        .update(campaignRecipientSlots)
        .set({
          listenerDisplayName: listenerName,
          listenerNote: listenerNote || `ガチャ連携: ${listenerName}`,
          ...(validatedRecipientId
            ? { recipientId: validatedRecipientId }
            : {}),
        })
        .where(eq(campaignRecipientSlots.id, slotId));
    }
    await db
      .update(claims)
      .set({
        recipientDisplayName: listenerName,
        updatedAt: new Date(),
      })
      .where(eq(claims.id, claimId));

    // 現在の紐付けを取得して比較
    const currentClaimAssets = await db
      .select({ campaignAssetId: claimAssets.campaignAssetId })
      .from(claimAssets)
      .where(eq(claimAssets.claimId, claimId));

    const currentIds = new Set(currentClaimAssets.map((ca) => ca.campaignAssetId));
    const newIds = new Set(assetsToLink.map((a) => a.id));

    const isSame =
      currentIds.size === newIds.size &&
      [...newIds].every((id) => currentIds.has(id));

    if (!isSame && slotId) {
      await db.delete(claimAssets).where(eq(claimAssets.claimId, claimId));

      if (assetsToLink.length > 0) {
        await db.insert(claimAssets).values(
          assetsToLink.map((a) => ({
            claimId,
            campaignAssetId: a.id,
          }))
        );
      }

      await recomputeSlotAssetsFromClaims(db, slotId);

      const [slotAssetCount] = await db
        .select({ id: slotAssets.slotId })
        .from(slotAssets)
        .where(eq(slotAssets.slotId, slotId))
        .limit(1);

      await db
        .update(campaignRecipientSlots)
        .set({ status: slotAssetCount ? "ready" : "unlinked" })
        .where(eq(campaignRecipientSlots.id, slotId));
    }

    const [slotMeta] = existingClaim.recipientSlotId
      ? await db
          .select({ recipientId: campaignRecipientSlots.recipientId })
          .from(campaignRecipientSlots)
          .where(eq(campaignRecipientSlots.id, existingClaim.recipientSlotId))
          .limit(1)
      : [];

    const payload = {
      ok: true,
      claim_url: `${base}/claim/${encodeURIComponent(existingClaim.claimSecret)}`,
      claim_id: claimId,
      slot_id: existingClaim.recipientSlotId,
      recipient_id: slotMeta?.recipientId ?? validatedRecipientId,
      external_transaction_id: externalTxId,
      linked_asset_count: assetsToLink.length,
    };
    await putCachedJsonResponse(
      auth.integrationTokenId,
      ROUTE_KEY,
      idemHeader,
      payload
    );
    return jsonWithCors(payload, request);
  }

  // ── スロット＆Claim 作成（新規） ──
  try {
    const result = await createSlotAndClaim({
      campaignId,
      listenerDisplayName: listenerName,
      listenerNote: listenerNote || `ガチャ連携: ${listenerName}`,
      recipientId: validatedRecipientId,
    });

    // 冪等性を確保するため、作成された Claim の externalTransactionId を上書き
    await db.update(claims)
      .set({ externalTransactionId: externalTxId })
      .where(eq(claims.id, result.claimId));

    // 選定されたアセットを Claim と Slot に紐付け
    if (assetsToLink.length > 0) {
      await db.insert(claimAssets).values(
        assetsToLink.map((a) => ({
          claimId: result.claimId,
          campaignAssetId: a.id,
        }))
      );
      await db.insert(slotAssets).values(
        assetsToLink.map((a) => ({
          slotId: result.slotId,
          campaignAssetId: a.id,
        }))
      );
      // ステータスを準備完了に更新
      await db
        .update(campaignRecipientSlots)
        .set({ status: "ready" })
        .where(eq(campaignRecipientSlots.id, result.slotId));
    }

    const claimUrl = `${base}/claim/${encodeURIComponent(result.claimSecret)}`;

    const [newSlotMeta] = await db
      .select({ recipientId: campaignRecipientSlots.recipientId })
      .from(campaignRecipientSlots)
      .where(eq(campaignRecipientSlots.id, result.slotId))
      .limit(1);

    const payload = {
      ok: true,
      claim_url: claimUrl,
      claim_id: result.claimId,
      slot_id: result.slotId,
      recipient_id: newSlotMeta?.recipientId ?? validatedRecipientId,
      external_transaction_id: externalTxId,
      linked_asset_count: assetsToLink.length,
    };

    await putCachedJsonResponse(
      auth.integrationTokenId,
      ROUTE_KEY,
      idemHeader,
      payload
    );

    return jsonWithCors(payload, request, { status: 201 });
  } catch (e) {
    console.error("recipient-slots create error:", e);
    return jsonWithCors(
      {
        error: "internal_error",
        message: "受取人スロットの作成に失敗しました",
      },
      request,
      { status: 500 }
    );
  }
}
