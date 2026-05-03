import { NextResponse } from "next/server";

import { deleteCampaignAssetLinks } from "@/lib/assets/workspace-library";
import { getSessionWorkspaceContext } from "@/lib/auth/session";

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { campaignId?: string; assetIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const campaignId = body.campaignId?.trim();
  const assetIds = Array.isArray(body.assetIds) ? body.assetIds : [];

  if (!campaignId || assetIds.length === 0) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const deleted = await deleteCampaignAssetLinks({
    workspaceId: ctx.workspaceId,
    campaignId,
    assetIds,
  });

  return NextResponse.json({ success: true, deleted });
}
