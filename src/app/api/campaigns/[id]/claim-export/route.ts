import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { buildClaimPageUrl } from "@/lib/claims/base-url";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { assets as libraryAssets, campaignAssets, campaigns, claims } from "@/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

type ClaimExportRow = {
  recipientDisplayName: string;
  assetLabel: string;
  status: string;
  externalTransactionId: string;
  claimUrl: string;
};

export async function GET(request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await ctx.params;
  const db = getDb();

  const camp = await db
    .select({ id: campaigns.id, name: campaigns.name })
    .from(campaigns)
    .where(
      and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, session.workspaceId))
    )
    .limit(1);

  if (!camp[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      claim: claims,
      ca: campaignAssets,
      libName: libraryAssets.originalFilename,
    })
    .from(claims)
    .innerJoin(campaignAssets, eq(claims.campaignAssetId, campaignAssets.id))
    .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
    .leftJoin(libraryAssets, eq(campaignAssets.assetId, libraryAssets.id))
    .where(
      and(
        eq(campaigns.workspaceId, session.workspaceId),
        eq(campaignAssets.campaignId, campaignId)
      )
    );

  const exportRows: ClaimExportRow[] = rows.map((r) => {
    const assetLabel =
      r.libName?.trim() || r.ca.label?.trim() || "—";
    const name = r.claim.recipientDisplayName?.trim() || "";
    return {
      recipientDisplayName: name,
      assetLabel,
      status: r.claim.status,
      externalTransactionId: r.claim.externalTransactionId,
      claimUrl: buildClaimPageUrl(request, r.claim.claimSecret),
    };
  });

  return NextResponse.json({
    campaignId,
    campaignName: camp[0].name,
    rows: exportRows,
  });
}
