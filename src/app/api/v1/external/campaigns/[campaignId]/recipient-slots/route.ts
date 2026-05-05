import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  campaignAssets,
  campaigns,
  claimAssets,
  claims,
} from "@/db/schema";
import { createSlotAndClaim } from "@/lib/claims/create-slot-and-claim";
import { resolveIntegrationBearer } from "@/lib/external-auth";
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
 * ガチャ等の外部アプリから呼び出し、キャンペーンに受取人スロット（名簿枠）を作成する。
 * キャンペーンに紐づく全アセットを自動でClaimに割り当てる。
 *
 * Body: { listener_display_name: string, external_transaction_id: string }
 * 冪等: 同じ external_transaction_id が既に存在すれば既存の claim_url を返す。
 */
export async function POST(request: Request, ctx: RouteParams) {
  // ── 認証 ──
  const auth = await resolveIntegrationBearer(request, "claims:issue");
  if (auth instanceof Response) {
    return auth;
  }

  // ── Idempotency-Key キャッシュ ──
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
  const { campaignId } = await ctx.params;

  let body: {
    listener_display_name?: unknown;
    external_transaction_id?: unknown;
    campaign_asset_ids?: unknown;
    listener_note?: unknown;
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

  // ── ガチャ連携フラグと配布モード・セキュリティ・ステータスの自動調整 ──
  // 外部APIが叩かれたら自動的に「公開中（active / high / per_link）」に固定し、外部連携フラグを立てる
  if (
    !camp[0].isExternalLinked ||
    camp[0].distributionMode !== "per_link" ||
    camp[0].securityLevel !== "high" ||
    camp[0].status !== "active"
  ) {
    await db
      .update(campaigns)
      .set({
        isExternalLinked: true,
        distributionMode: "per_link",
        securityLevel: "high",
        status: "active",
      })
      .where(eq(campaigns.id, campaignId));
  }

  // ── キャンペーンのアセット取得 ──
  const allAssetRows = await db
    .select({ id: campaignAssets.id })
    .from(campaignAssets)
    .where(eq(campaignAssets.campaignId, campaignId));

  // 配布対象アセットの選定
  let assetsToLink = allAssetRows;
  if (requestedAssetIds !== null) {
    const idSet = new Set(requestedAssetIds);
    assetsToLink = allAssetRows.filter((a) => idSet.has(a.id));
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

    // 現在の紐付けを取得して比較
    const currentClaimAssets = await db
      .select({ campaignAssetId: claimAssets.campaignAssetId })
      .from(claimAssets)
      .where(eq(claimAssets.claimId, claimId));

    const currentIds = new Set(currentClaimAssets.map((ca) => ca.campaignAssetId));
    const newIds = new Set(assetsToLink.map((a) => a.id));

    // セットの内容が異なる場合は同期
    const isSame =
      currentIds.size === newIds.size &&
      [...newIds].every((id) => currentIds.has(id));

    if (!isSame) {
      await db.delete(claimAssets).where(eq(claimAssets.claimId, claimId));
      await db.delete(slotAssets).where(eq(slotAssets.slotId, existingClaim.recipientSlotId));

      if (assetsToLink.length > 0) {
        await db.insert(claimAssets).values(
          assetsToLink.map((a) => ({
            claimId: claimId,
            campaignAssetId: a.id,
          }))
        );
        await db.insert(slotAssets).values(
          assetsToLink.map((a) => ({
            slotId: existingClaim.recipientSlotId,
            campaignAssetId: a.id,
          }))
        );
        // ステータスを準備完了に更新
        await db
          .update(campaignRecipientSlots)
          .set({ status: "ready" })
          .where(eq(campaignRecipientSlots.id, existingClaim.recipientSlotId));
      } else {
        // アセットが0件になった場合は未紐付けに戻す
        await db
          .update(campaignRecipientSlots)
          .set({ status: "unlinked" })
          .where(eq(campaignRecipientSlots.id, existingClaim.recipientSlotId));
      }
    }

    const payload = {
      ok: true,
      claim_url: `${base}/claim/${encodeURIComponent(existingClaim.claimSecret)}`,
      claim_id: claimId,
      slot_id: existingClaim.recipientSlotId,
      external_transaction_id: externalTxId,
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
    });

    // externalTransactionId を上書き
    await db
      .update(claims)
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

    const payload = {
      ok: true,
      claim_url: claimUrl,
      claim_id: result.claimId,
      slot_id: result.slotId,
      external_transaction_id: externalTxId,
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
