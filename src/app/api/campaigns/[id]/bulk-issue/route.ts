import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { buildClaimPageUrl } from "@/lib/claims/base-url";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { issueClaimsBatch } from "@/lib/issue-claims-logic";
import { getDb } from "@/db";
import { campaignAssets, campaigns } from "@/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

/** `/issue-claims` と同じ上限（キャンペーン内アセット件数） */
const MAX_ITEMS = 50;

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

  if (assetRows.length > MAX_ITEMS) {
    return NextResponse.json(
      {
        error: "too_many_assets",
        message: `アセットは最大 ${MAX_ITEMS} 件まで一括発行できます`,
      },
      { status: 400 }
    );
  }

  const items = assetRows.map((a) => ({
    campaign_asset_id: a.id,
    external_transaction_id: `bulk-${campaignId}-${a.id}`,
    recipient_display_name: recipientPrefix,
  }));

  const results = await issueClaimsBatch(session.workspaceId, items, (secret) =>
    buildClaimPageUrl(request, secret)
  );

  return NextResponse.json({ results });
}
