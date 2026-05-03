import { randomUUID } from "node:crypto";
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
  let body: { campaignAssetId?: string; recipientDisplayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const campaignAssetId = body.campaignAssetId?.trim();
  const recipientDisplayName = body.recipientDisplayName?.trim();

  if (!campaignAssetId) {
    return NextResponse.json(
      { error: "invalid_body", message: "campaign_asset_id が必要です" },
      { status: 400 }
    );
  }
  if (!recipientDisplayName) {
    return NextResponse.json(
      { error: "invalid_body", message: "recipient_display_name が必要です" },
      { status: 400 }
    );
  }

  const db = getDb();
  const row = await db
    .select({ id: campaignAssets.id })
    .from(campaignAssets)
    .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
    .where(
      and(
        eq(campaignAssets.id, campaignAssetId),
        eq(campaignAssets.campaignId, campaignId),
        eq(campaigns.workspaceId, session.workspaceId)
      )
    )
    .limit(1);

  if (!row[0]) {
    return NextResponse.json(
      { error: "not_found", message: "キャンペーンに紐づくアセットではありません" },
      { status: 404 }
    );
  }

  const external_transaction_id = `recv-${randomUUID()}`;
  const results = await issueClaimsBatch(
    session.workspaceId,
    [
      {
        campaign_asset_ids: [campaignAssetId],
        external_transaction_id,
        recipient_display_name: recipientDisplayName,
      },
    ],
    (secret) => buildClaimPageUrl(request, secret)
  );

  const first = results[0];
  if (!first?.ok) {
    return NextResponse.json(
      {
        ok: false,
        external_transaction_id,
        error: first?.error ?? "発行に失敗しました",
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      claim_url: first.claim_url,
      external_transaction_id,
    },
    { status: 201 }
  );
}
