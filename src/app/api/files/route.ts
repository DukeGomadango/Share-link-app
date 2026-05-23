import { NextResponse } from "next/server";

import { fetchAssetsWithCampaignLabels } from "@/lib/assets/workspace-library";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getWorkspaceStorageSnapshot } from "@/lib/workspace/workspace-storage";

export async function GET() {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getWorkspaceStorageSnapshot(ctx.workspaceId);
  if (!snapshot) {
    return NextResponse.json({ error: "workspace_not_found" }, { status: 404 });
  }

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
      usedBytes: snapshot.usedBytes,
      limitBytes: snapshot.limitBytes,
      planTier: snapshot.planTier,
      workspaceId: snapshot.workspaceId,
    },
  });
}
