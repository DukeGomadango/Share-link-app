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
import {
  applyGachaSyncToClaim,
  detachOrPurgeGachaExternalSlot,
  resolveClaimByRecipientId,
} from "@/lib/claims/gacha-recipient-slot-sync";
import {
  buildRecipientSlotLookupPayload,
  buildRecipientSlotPayload,
} from "@/lib/claims/recipient-slot-payload";
import { externalLinkLockedCampaignFields } from "@/lib/campaigns/external-link-mode";
import { ensurePublicReceptionToken } from "@/lib/campaigns/public-reception-token";
import { resolveIntegrationBearer } from "@/lib/external-auth";
import { ensureCampaignToolIntegrationWritable } from "@/lib/external-integration-pause";
import { handleCorsPreflight, jsonWithCors } from "@/lib/external-cors";
import {
  getCachedJsonResponse,
  putCachedJsonResponse,
} from "@/lib/external-idempotency";

type RouteParams = { params: Promise<{ campaignId: string }> };

const ROUTE_KEY = "POST /api/v1/external/campaigns/:id/recipient-slots";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

/**
 * 冪等キーで配布枠の有無を確認する（ツールのリンク切れ検知用）。
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

  const payload = await buildRecipientSlotLookupPayload(request, campaignId, {
    claimSecret: row.claimSecret,
    claimId: row.claimId,
    slotId: row.slotId,
    recipientId: row.recipientId,
    externalTxId,
  });

  return jsonWithCors(payload, request);
}

/**
 * ガチャプレイヤー削除。既定 mode=detach（受付枠維持）。
 */
export async function DELETE(request: Request, ctx: RouteParams) {
  const auth = await resolveIntegrationBearer(request, "claims:issue");
  if (auth instanceof Response) return auth;

  const { campaignId } = await ctx.params;
  const url = new URL(request.url);
  const externalTxId = url.searchParams.get("external_transaction_id")?.trim();
  const modeParam = url.searchParams.get("mode")?.trim();
  const mode = modeParam === "purge" ? "purge" : "detach";

  if (!externalTxId) {
    return jsonWithCors(
      { error: "missing_parameter", message: "external_transaction_id が必要です" },
      request,
      { status: 400 }
    );
  }

  const db = getDb();

  const camp = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, auth.workspaceId)))
    .limit(1);

  if (!camp[0]) {
    return jsonWithCors(
      { error: "not_found", message: "キャンペーンが見つかりません" },
      request,
      { status: 404 }
    );
  }

  const pauseBlock = await ensureCampaignToolIntegrationWritable(
    campaignId,
    auth.workspaceId,
    request
  );
  if (pauseBlock) return pauseBlock;

  const result = await detachOrPurgeGachaExternalSlot(db, externalTxId, mode);

  if (!result.ok) {
    return jsonWithCors(
      {
        error: result.error,
        message: "パスキー登録済みの受取枠は purge できません。detach を使ってください。",
      },
      request,
      { status: result.status }
    );
  }

  return jsonWithCors(result, request);
}

/**
 * 当選ファイルを受取枠に同期する。recipient_id 指定時は既存枠に載せる。
 */
export async function POST(request: Request, ctx: RouteParams) {
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
      { error: "invalid_body", message: "listener_display_name が必要です" },
      request,
      { status: 400 }
    );
  }
  if (!externalTxId) {
    return jsonWithCors(
      { error: "invalid_body", message: "external_transaction_id が必要です" },
      request,
      { status: 400 }
    );
  }

  const requestedRecipientId =
    typeof body.recipient_id === "string" ? body.recipient_id.trim() : "";

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

  const locked = externalLinkLockedCampaignFields();
  if (
    camp[0].distributionMode !== locked.distributionMode ||
    camp[0].securityLevel !== locked.securityLevel ||
    camp[0].status !== locked.status
  ) {
    await db.update(campaigns).set(locked).where(eq(campaigns.id, campaignId));
  }
  await ensurePublicReceptionToken(campaignId);

  const allAssetRows = await db
    .select({ id: campaignAssets.id, assetId: campaignAssets.assetId })
    .from(campaignAssets)
    .where(eq(campaignAssets.campaignId, campaignId));

  let assetsToLink = allAssetRows;
  if (requestedAssetIds !== null) {
    const idSet = new Set(requestedAssetIds.map((id) => id.toLowerCase()));
    assetsToLink = allAssetRows.filter((a) => {
      return (
        idSet.has(a.id.toLowerCase()) ||
        (a.assetId && idSet.has(a.assetId.toLowerCase()))
      );
    });
  }
  const assetIds = assetsToLink.map((a) => a.id);

  const syncInput = {
    externalTxId,
    listenerName,
    listenerNote: listenerNote || `ガチャ連携: ${listenerName}`,
    validatedRecipientId,
    assetIds,
  };

  const [existingClaim] = await db
    .select({
      claimSecret: claims.claimSecret,
      id: claims.id,
      recipientSlotId: claims.recipientSlotId,
    })
    .from(claims)
    .where(eq(claims.externalTransactionId, externalTxId))
    .limit(1);

  if (existingClaim?.recipientSlotId) {
    const syncResult = await applyGachaSyncToClaim(db, {
      claimId: existingClaim.id,
      slotId: existingClaim.recipientSlotId,
      ...syncInput,
    });

    const [slotMeta] = await db
      .select({ recipientId: campaignRecipientSlots.recipientId })
      .from(campaignRecipientSlots)
      .where(eq(campaignRecipientSlots.id, existingClaim.recipientSlotId))
      .limit(1);

    const payload = await buildRecipientSlotPayload(request, {
      campaignId,
      claimId: existingClaim.id,
      claimSecret: existingClaim.claimSecret,
      slotId: existingClaim.recipientSlotId,
      recipientId: slotMeta?.recipientId ?? validatedRecipientId,
      externalTxId,
      linkedAssetCount: syncResult.linked_asset_count,
      slotStatus: syncResult.slot_status,
      resolvedExisting: true,
    });

    await putCachedJsonResponse(
      auth.integrationTokenId,
      ROUTE_KEY,
      idemHeader,
      payload
    );
    return jsonWithCors(payload, request);
  }

  if (validatedRecipientId) {
    const resolved = await resolveClaimByRecipientId(
      db,
      campaignId,
      validatedRecipientId,
      externalTxId
    );

    if (resolved && "conflict" in resolved) {
      return jsonWithCors(
        {
          error: "recipient_slot_conflict",
          message:
            "この名簿は既に別のガチャプレイヤーに紐づいています。管理画面で確認してください。",
        },
        request,
        { status: 409 }
      );
    }

    if (resolved && "claimId" in resolved) {
      const syncResult = await applyGachaSyncToClaim(db, {
        claimId: resolved.claimId,
        slotId: resolved.slotId,
        ...syncInput,
      });

      const [slotMeta] = await db
        .select({ recipientId: campaignRecipientSlots.recipientId })
        .from(campaignRecipientSlots)
        .where(eq(campaignRecipientSlots.id, resolved.slotId))
        .limit(1);

      const payload = await buildRecipientSlotPayload(request, {
        campaignId,
        claimId: resolved.claimId,
        claimSecret: resolved.claimSecret,
        slotId: resolved.slotId,
        recipientId: slotMeta?.recipientId ?? validatedRecipientId,
        externalTxId,
        linkedAssetCount: syncResult.linked_asset_count,
        slotStatus: syncResult.slot_status,
        resolvedExisting: true,
      });

      await putCachedJsonResponse(
        auth.integrationTokenId,
        ROUTE_KEY,
        idemHeader,
        payload
      );
      return jsonWithCors(payload, request);
    }
  }

  try {
    const result = await createSlotAndClaim({
      campaignId,
      listenerDisplayName: listenerName,
      listenerNote: syncInput.listenerNote,
      recipientId: validatedRecipientId,
    });

    await db
      .update(claims)
      .set({ externalTransactionId: externalTxId })
      .where(eq(claims.id, result.claimId));

    if (assetIds.length > 0) {
      await db.insert(claimAssets).values(
        assetIds.map((campaignAssetId) => ({
          claimId: result.claimId,
          campaignAssetId,
        }))
      );
      await db.insert(slotAssets).values(
        assetIds.map((campaignAssetId) => ({
          slotId: result.slotId,
          campaignAssetId,
        }))
      );
      await db
        .update(campaignRecipientSlots)
        .set({ status: "ready" })
        .where(eq(campaignRecipientSlots.id, result.slotId));
    }

    const [newSlotMeta] = await db
      .select({ recipientId: campaignRecipientSlots.recipientId })
      .from(campaignRecipientSlots)
      .where(eq(campaignRecipientSlots.id, result.slotId))
      .limit(1);

    const payload = await buildRecipientSlotPayload(request, {
      campaignId,
      claimId: result.claimId,
      claimSecret: result.claimSecret,
      slotId: result.slotId,
      recipientId: newSlotMeta?.recipientId ?? validatedRecipientId,
      externalTxId,
      linkedAssetCount: assetIds.length,
      slotStatus: assetIds.length > 0 ? "ready" : "unlinked",
      resolvedExisting: false,
    });

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
