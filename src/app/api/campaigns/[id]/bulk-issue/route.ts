import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { buildClaimPageUrl } from "@/lib/claims/base-url";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { issueClaimsBatch } from "@/lib/issue-claims-logic";
import { getDb } from "@/db";
import { campaignAssets, campaigns } from "@/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await ctx.params;
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

  let recipientPrefix: string | null = null;
  try {
    const body = await request.json();
    if (body && typeof body === "object" && "recipientPrefix" in body) {
      const v = (body as { recipientPrefix?: unknown }).recipientPrefix;
      recipientPrefix =
        typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null;
    }
  } catch {
    /* body なし */
  }

  const assetRows = await db
    .select({ id: campaignAssets.id })
    .from(campaignAssets)
    .where(eq(campaignAssets.campaignId, campaignId));

  if (assetRows.length === 0) {
    return NextResponse.json(
      { error: "no_assets", message: "キャンペーンにアセットがありません" },
      { status: 400 }
    );
  }

  const allAssetIds = assetRows.map((a) => a.id);

  // キャンペーン内の全アセットをセットにしたリンクを1つ作成
  const items = [
    {
      campaign_asset_ids: allAssetIds,
      external_transaction_id: `bulk-${campaignId}-${Date.now()}`,
      recipient_display_name: recipientPrefix || "一括生成分",
    },
  ];

  const results = await issueClaimsBatch(session.workspaceId, items, (secret) =>
    buildClaimPageUrl(request, secret)
  );

  return NextResponse.json({ results });
}
