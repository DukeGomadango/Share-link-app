import { NextResponse } from "next/server";

import { createSignedReadUrl } from "@/lib/assets/signed-urls";
import { fetchAssetsWithCampaignLabels } from "@/lib/assets/workspace-library";
import { getSessionWorkspaceContext } from "@/lib/auth/session";

export async function GET() {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await fetchAssetsWithCampaignLabels(ctx.workspaceId);

  const out = await Promise.all(
    rows.map(async (a) => {
      const url = await createSignedReadUrl(a.bucket, a.objectKey);
      const signed = url ?? "";
      return {
        id: a.id,
        name: a.originalFilename,
        type: a.mimeType,
        size: a.sizeBytes,
        createdAt: a.createdAt.toISOString(),
        url: signed,
        previewUrl: a.mimeType.startsWith("image/") ? signed : "",
        linkedCampaigns: a.linkedCampaigns,
      };
    })
  );

  return NextResponse.json(out);
}
