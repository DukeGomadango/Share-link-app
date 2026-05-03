import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { assets, campaignAssets, campaigns } from "@/db/schema";

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { fileIds?: string[]; campaignId?: string; campaignName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fileIds = Array.isArray(body.fileIds) ? body.fileIds : [];
  const campaignId = body.campaignId?.trim();
  const campaignName = body.campaignName?.trim();

  if (fileIds.length === 0) {
    return NextResponse.json({ error: "fileIds が空です" }, { status: 400 });
  }

  const db = getDb();

  let camp: { id: string; name: string } | undefined;
  if (campaignId) {
    const c = await db
      .select({ id: campaigns.id, name: campaigns.name })
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, ctx.workspaceId)))
      .limit(1);
    camp = c[0];
  } else if (campaignName) {
    const c = await db
      .select({ id: campaigns.id, name: campaigns.name })
      .from(campaigns)
      .where(and(eq(campaigns.name, campaignName), eq(campaigns.workspaceId, ctx.workspaceId)))
      .limit(1);
    camp = c[0];
  }

  if (!camp) {
    return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
  }

  const assetRows = await db
    .select({ id: assets.id, name: assets.originalFilename })
    .from(assets)
    .where(eq(assets.workspaceId, ctx.workspaceId));

  const idSet = new Set(assetRows.map((a) => a.id));
  const nameById = new Map(assetRows.map((a) => [a.id, a.name]));

  let added = 0;
  let skipped = 0;

  for (const fileId of fileIds) {
    if (!idSet.has(fileId)) {
      continue;
    }

    const exists = await db
      .select({ id: campaignAssets.id })
      .from(campaignAssets)
      .where(
        and(eq(campaignAssets.campaignId, camp.id), eq(campaignAssets.assetId, fileId))
      )
      .limit(1);

    if (exists[0]) {
      skipped += 1;
      continue;
    }

    await db.insert(campaignAssets).values({
      campaignId: camp.id,
      label: nameById.get(fileId) ?? null,
      assetId: fileId,
      assetUrl: null,
    });
    added += 1;
  }

  return NextResponse.json({
    success: true,
    added,
    skipped,
    campaignName: camp.name,
  });
}
