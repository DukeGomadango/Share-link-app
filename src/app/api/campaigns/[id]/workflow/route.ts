import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSignedReadUrl } from "@/lib/assets/signed-urls";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { fetchCampaignWithStats } from "@/lib/campaigns-query";
import { getDb } from "@/db";
import { assets as libraryAssets, campaignAssets, campaigns, claims } from "@/db/schema";
import type { Campaign, FileItem, Recipient } from "@/components/features/campaigns/types";

type RouteParams = { params: Promise<{ id: string }> };

function guessType(mime: string | undefined, fallbackUrl: string | null): "audio" | "image" {
  if (mime?.startsWith("audio/")) return "audio";
  if (mime?.startsWith("image/")) return "image";
  const u = fallbackUrl?.toLowerCase() ?? "";
  if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/.test(u)) return "audio";
  return "image";
}

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

  const campaign = (await fetchCampaignWithStats(
    session.workspaceId,
    campaignId
  )) as Campaign | null;
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assetRows = await db
    .select({
      ca: campaignAssets,
      lib: libraryAssets,
    })
    .from(campaignAssets)
    .leftJoin(libraryAssets, eq(campaignAssets.assetId, libraryAssets.id))
    .where(eq(campaignAssets.campaignId, campaignId));

  const poolFiles: FileItem[] = await Promise.all(
    assetRows.map(async ({ ca, lib }) => {
      let name = ca.label?.trim() || "file";
      let previewUrl: string | undefined;
      let type: "audio" | "image" = "image";

      if (lib) {
        name = lib.originalFilename;
        type = guessType(lib.mimeType, null);
        const signed = await createSignedReadUrl(lib.bucket, lib.objectKey);
        previewUrl = signed ?? undefined;
      } else if (ca.assetUrl?.trim()) {
        previewUrl = ca.assetUrl.trim();
        type = guessType(undefined, ca.assetUrl);
      }

      return {
        id: ca.id,
        name,
        type,
        previewUrl,
      };
    })
  );

  const claimRows = await db
    .select({
      claim: claims,
      campaignAssetId: campaignAssets.id,
    })
    .from(claims)
    .innerJoin(campaignAssets, eq(claims.campaignAssetId, campaignAssets.id))
    .where(eq(campaignAssets.campaignId, campaignId));

  const recipients: Recipient[] = claimRows.map((row) => ({
    id: row.claim.id,
    name: row.claim.recipientDisplayName?.trim() || "（無名）",
    email: "",
    assignedFileIds: [row.campaignAssetId],
    link: `/claim/${encodeURIComponent(row.claim.claimSecret)}`,
  }));

  return NextResponse.json({
    campaign,
    poolFiles,
    recipients,
  });
}
