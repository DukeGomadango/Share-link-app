import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import {
  campaignAssets,
  campaignRecipientSlots,
  campaigns,
  claims,
} from "@/db/schema";

type RouteParams = { params: Promise<{ id: string; claimId: string }> };

export async function PATCH(request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId, claimId } = await ctx.params;

  let body: { campaignAssetId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const assetId = body.campaignAssetId?.trim();
  if (!assetId) {
    return NextResponse.json(
      { error: "invalid_body", message: "campaign_asset_id が必要です" },
      { status: 400 }
    );
  }

  const db = getDb();

  const targetAsset = await db
    .select({ id: campaignAssets.id })
    .from(campaignAssets)
    .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
    .where(
      and(
        eq(campaignAssets.id, assetId),
        eq(campaignAssets.campaignId, campaignId),
        eq(campaigns.workspaceId, session.workspaceId)
      )
    )
    .limit(1);

  if (!targetAsset[0]) {
    return NextResponse.json(
      { error: "not_found", message: "キャンペーンに紐づくアセットではありません" },
      { status: 404 }
    );
  }

  const rows = await db
    .select({
      claim: claims,
      slot: campaignRecipientSlots,
      caLegacy: campaignAssets,
    })
    .from(claims)
    .leftJoin(
      campaignRecipientSlots,
      eq(claims.recipientSlotId, campaignRecipientSlots.id)
    )
    .leftJoin(campaignAssets, eq(claims.campaignAssetId, campaignAssets.id))
    .where(eq(claims.id, claimId))
    .limit(1);

  const hit = rows[0];
  if (!hit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const belongsToCampaign =
    (hit.slot && hit.slot.campaignId === campaignId) ||
    (hit.caLegacy && hit.caLegacy.campaignId === campaignId);

  if (!belongsToCampaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (hit.slot) {
    await db
      .update(campaignRecipientSlots)
      .set({
        campaignAssetId: assetId,
        status: "ready",
      })
      .where(eq(campaignRecipientSlots.id, hit.slot.id));
  }

  await db
    .update(claims)
    .set({ campaignAssetId: assetId })
    .where(eq(claims.id, claimId));

  return NextResponse.json({ ok: true });
}
