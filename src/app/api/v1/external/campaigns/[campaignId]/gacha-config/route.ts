import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { assets as libraryAssets, campaigns, campaignAssets } from "@/db/schema";
import { resolveCampaignAssetDisplayName } from "@/lib/campaign-assets/display-name";
import { resolveIntegrationBearer } from "@/lib/external-auth";
import { ensureCampaignToolIntegrationWritable } from "@/lib/external-integration-pause";
import { handleCorsPreflight, jsonWithCors } from "@/lib/external-cors";

type RouteParams = { params: Promise<{ campaignId: string }> };

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request, { params }: RouteParams) {
  const auth = await resolveIntegrationBearer(request, "campaigns:read");
  if (auth instanceof Response) {
    return auth;
  }

  const { campaignId } = await params;
  const db = getDb();

  const campaignRows = await db
    .select({
      id: campaigns.id,
      gachaConfig: campaigns.gachaConfig,
    })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, campaignId),
        eq(campaigns.workspaceId, auth.workspaceId)
      )
    )
    .limit(1);

  const campaign = campaignRows[0];
  if (!campaign) {
    return jsonWithCors({ error: "not_found", message: "キャンペーンが見つかりません" }, request, { status: 404 });
  }

  const assetRows = await db
    .select({
      id: campaignAssets.id,
      label: campaignAssets.label,
      assetUrl: campaignAssets.assetUrl,
      gachaRarityId: campaignAssets.gachaRarityId,
      libraryOriginalFilename: libraryAssets.originalFilename,
    })
    .from(campaignAssets)
    .leftJoin(libraryAssets, eq(campaignAssets.assetId, libraryAssets.id))
    .where(eq(campaignAssets.campaignId, campaignId));

  return jsonWithCors({
    gachaConfig: campaign.gachaConfig,
    items: assetRows.map((a) => {
      const displayName = resolveCampaignAssetDisplayName({
        label: a.label,
        libraryOriginalFilename: a.libraryOriginalFilename,
        assetUrl: a.assetUrl,
      });
      return {
        id: a.id,
        label: a.label,
        displayName,
        rarityId: a.gachaRarityId,
      };
    }),
  }, request);
}

export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await resolveIntegrationBearer(request, "campaigns:write");
  if (auth instanceof Response) {
    return auth;
  }

  const { campaignId } = await params;
  const db = getDb();

  // キャンペーンの存在確認およびワークスペース所属チェック
  const campaignRows = await db
    .select({
      id: campaigns.id,
    })
    .from(campaigns)
    .where(
      and(
        eq(campaigns.id, campaignId),
        eq(campaigns.workspaceId, auth.workspaceId)
      )
    )
    .limit(1);

  const campaign = campaignRows[0];
  if (!campaign) {
    return jsonWithCors({ error: "not_found", message: "キャンペーンが見つかりません" }, request, { status: 404 });
  }

  const pauseBlock = await ensureCampaignToolIntegrationWritable(
    campaignId,
    auth.workspaceId,
    request
  );
  if (pauseBlock) return pauseBlock;

  let body: {
    gachaConfig?: {
      rarities: { id: string; name: string; probability: number; color: string }[];
    };
    assetRarityMappings?: { assetId: string; gachaRarityId: string | null }[];
  };

  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ error: "bad_request", message: "JSONが不正です" }, request, { status: 400 });
  }

  const { gachaConfig, assetRarityMappings } = body;

  try {
    await db.transaction(async (tx) => {
      // 1. キャンペーンのガチャ構成を更新
      await tx
        .update(campaigns)
        .set({
          gachaConfig,
        })
        .where(eq(campaigns.id, campaignId));

      // 2. 各アセットのレア度マッピングを一括更新
      if (Array.isArray(assetRarityMappings)) {
        for (const mapping of assetRarityMappings) {
          await tx
            .update(campaignAssets)
            .set({
              gachaRarityId: mapping.gachaRarityId,
            })
            .where(
              and(
                eq(campaignAssets.id, mapping.assetId),
                eq(campaignAssets.campaignId, campaignId)
              )
            );
        }
      }
    });

    return jsonWithCors({ ok: true, message: "同期が成功しました" }, request);
  } catch (e) {
    const err = e as Error;
    console.error("Failed to update gacha config:", err);
    return jsonWithCors({ error: "internal_error", message: err.message || "更新に失敗しました" }, request, { status: 500 });
  }
}

