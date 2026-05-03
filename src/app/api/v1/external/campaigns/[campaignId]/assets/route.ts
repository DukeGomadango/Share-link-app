import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { campaignAssets, campaigns } from "@/db/schema";
import { resolveIntegrationBearer } from "@/lib/external-auth";
import { handleCorsPreflight, jsonWithCors } from "@/lib/external-cors";

type RouteParams = { params: Promise<{ campaignId: string }> };

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request, ctx: RouteParams) {
  const auth = await resolveIntegrationBearer(request, "campaigns:read");
  if (auth instanceof Response) {
    return auth;
  }

  const { campaignId } = await ctx.params;
  const db = getDb();

  const camp = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(
      and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, auth.workspaceId))
    )
    .limit(1);

  if (!camp[0]) {
    return jsonWithCors({ error: "not_found", message: "キャンペーンが見つかりません" }, request, {
      status: 404,
    });
  }

  const assets = await db
    .select({
      id: campaignAssets.id,
      campaignId: campaignAssets.campaignId,
      label: campaignAssets.label,
      assetUrl: campaignAssets.assetUrl,
      createdAt: campaignAssets.createdAt,
    })
    .from(campaignAssets)
    .where(eq(campaignAssets.campaignId, campaignId));

  return jsonWithCors(
    {
      campaign_id: campaignId,
      assets: assets.map((a) => ({
        id: a.id,
        campaign_id: a.campaignId,
        label: a.label,
        asset_url: a.assetUrl,
        created_at: a.createdAt.toISOString(),
      })),
    },
    request
  );
}
