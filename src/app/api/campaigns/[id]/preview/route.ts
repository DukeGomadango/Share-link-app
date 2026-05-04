import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSignedReadUrl } from "@/lib/assets/signed-urls";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { assets as libraryAssets, campaignAssets, campaigns } from "@/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: RouteParams) {
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

  const assetRows = await db
    .select({
      lib: libraryAssets,
    })
    .from(campaignAssets)
    .innerJoin(libraryAssets, eq(campaignAssets.assetId, libraryAssets.id))
    .where(eq(campaignAssets.campaignId, campaignId))
    .limit(4);

  const previews = await Promise.all(
    assetRows.map(async ({ lib }) => {
      const signed = await createSignedReadUrl(lib.bucket, lib.objectKey);
      return {
        id: lib.id,
        name: lib.originalFilename,
        mimeType: lib.mimeType,
        url: signed ?? undefined,
      };
    })
  );

  return NextResponse.json({ previews });
}
