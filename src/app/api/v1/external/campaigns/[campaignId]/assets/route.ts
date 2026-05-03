import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { assets as libraryAssets, campaignAssets, campaigns } from "@/db/schema";
import { createSignedReadUrl } from "@/lib/assets/signed-urls";
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

  const rows = await db
    .select({
      id: campaignAssets.id,
      campaignId: campaignAssets.campaignId,
      label: campaignAssets.label,
      assetUrl: campaignAssets.assetUrl,
      assetId: campaignAssets.assetId,
      createdAt: campaignAssets.createdAt,
      libBucket: libraryAssets.bucket,
      libObjectKey: libraryAssets.objectKey,
    })
    .from(campaignAssets)
    .leftJoin(libraryAssets, eq(campaignAssets.assetId, libraryAssets.id))
    .where(eq(campaignAssets.campaignId, campaignId));

  const mapped = await Promise.all(
    rows.map(async (a) => {
      let resolved: string | null = a.assetUrl?.trim() || null;
      if (a.libBucket && a.libObjectKey) {
        const u = await createSignedReadUrl(a.libBucket, a.libObjectKey);
        if (u) {
          resolved = u;
        }
      }
      return {
        id: a.id,
        campaign_id: a.campaignId,
        label: a.label,
        asset_url: resolved,
        library_asset_id: a.assetId,
        created_at: a.createdAt.toISOString(),
      };
    })
  );

  return jsonWithCors(
    {
      campaign_id: campaignId,
      assets: mapped,
    },
    request
  );
}
