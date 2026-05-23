import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { assets, workspaces } from "@/db/schema";
import { fetchAssetsWithCampaignLabels } from "@/lib/assets/workspace-library";
import { getSessionWorkspaceContext } from "@/lib/auth/session";

export async function GET() {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  
  // 1. Fetch workspace stats
  const [workspace] = await db
    .select({
      planTier: workspaces.planTier,
      storageLimit: workspaces.storageLimit,
    })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1);

  const [usage] = await db
    .select({
      totalBytes: sql<number>`COALESCE(SUM(${assets.sizeBytes}), 0)::bigint`,
    })
    .from(assets)
    .where(eq(assets.workspaceId, ctx.workspaceId));

  // 2. Fetch files
  const rows = await fetchAssetsWithCampaignLabels(ctx.workspaceId);

  const files = rows.map((a) => ({
    id: a.id,
    name: a.originalFilename,
    type: a.mimeType,
    size: a.sizeBytes,
    createdAt: a.createdAt.toISOString(),
    expiresAt: a.expiresAt?.toISOString(),
    url: "",
    previewUrl: "",
    linkedCampaigns: a.linkedCampaigns,
  }));

  return NextResponse.json({
    files,
    stats: {
      usedBytes: Number(usage?.totalBytes || 0),
      limitBytes: workspace?.storageLimit || 2147483648,
      planTier: workspace?.planTier || "free",
      workspaceId: ctx.workspaceId,
    },
  });
}
