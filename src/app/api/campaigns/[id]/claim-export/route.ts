import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { buildClaimPageUrl } from "@/lib/claims/base-url";
import { fetchWorkflowRecipientsForCampaign } from "@/lib/claims/workflow-recipients";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import {
  assets as libraryAssets,
  campaignAssets,
  campaigns,
  claims,
} from "@/db/schema";

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

  const wf = await fetchWorkflowRecipientsForCampaign(campaignId, session.workspaceId);

  if (wf.length === 0) {
    return NextResponse.json({
      campaignId,
      campaignName: camp[0].name,
      rows: [],
    });
  }

  const assetIds = [
    ...new Set(
      wf.flatMap((w) => w.assignedFileIds).filter((x): x is string => x != null)
    ),
  ];

  const labelRows =
    assetIds.length === 0
      ? []
      : await db
          .select({
            ca: campaignAssets,
            libName: libraryAssets.originalFilename,
          })
          .from(campaignAssets)
          .leftJoin(libraryAssets, eq(campaignAssets.assetId, libraryAssets.id))
          .where(inArray(campaignAssets.id, assetIds));

  const labelByAssetId = new Map<string, string>();
  for (const r of labelRows) {
    const label =
      r.libName?.trim() || r.ca.label?.trim() || r.ca.assetUrl?.trim() || "—";
    labelByAssetId.set(r.ca.id, label);
  }

  const claimRows = await db
    .select({
      id: claims.id,
      claimSecret: claims.claimSecret,
      status: claims.status,
      externalTransactionId: claims.externalTransactionId,
      recipientDisplayName: claims.recipientDisplayName,
    })
    .from(claims)
    .where(inArray(claims.id, wf.map((w) => w.claimId)));

  const claimMeta = new Map(claimRows.map((c) => [c.id, c]));

  const exportRows: ClaimExportRow[] = wf.map((w) => {
    const meta = claimMeta.get(w.claimId);
    const labels = w.assignedFileIds
      .map((id) => labelByAssetId.get(id))
      .filter((x): x is string => x != null);
    const assetLabel = labels.length > 0 ? labels.join(", ") : "—（未割当）";
    const name =
      w.recipientDisplayName?.trim() ||
      meta?.recipientDisplayName?.trim() ||
      "";
    const secret = meta?.claimSecret ?? "";
    return {
      recipientDisplayName: name,
      assetLabel,
      status: meta?.status ?? "issued",
      externalTransactionId: meta?.externalTransactionId ?? "",
      claimUrl: secret ? buildClaimPageUrl(request, secret) : "",
    };
  });

  return NextResponse.json({
    campaignId,
    campaignName: camp[0].name,
    rows: exportRows,
  });
}
