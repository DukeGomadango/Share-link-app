import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSignedReadUrl } from "@/lib/assets/signed-urls";
import { fetchWorkflowRecipientsForCampaign } from "@/lib/claims/workflow-recipients";
import { ensurePublicReceptionToken } from "@/lib/campaigns/public-reception-token";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { fetchCampaignWithStats } from "@/lib/campaigns-query";
import { getDb } from "@/db";
import { assets as libraryAssets, campaignAssets, campaigns } from "@/db/schema";
import type { Campaign, FileItem } from "@/components/features/campaigns/types";

type RouteParams = { params: Promise<{ id: string }> };

function guessType(mime: string | undefined, fallbackUrl: string | null): "audio" | "image" | "file" {
  if (mime?.startsWith("audio/")) return "audio";
  if (mime?.startsWith("image/")) return "image";
  const u = fallbackUrl?.toLowerCase() ?? "";
  if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/.test(u)) return "audio";
  if (/\.(jpg|jpeg|png|gif|webp|avif|heic|heif|bmp|svg)(\?|$)/.test(u)) return "image";
  return "file";
}

export async function GET(_request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await ctx.params;
  const db = getDb();

  const owned = await db
    .select({
      id: campaigns.id,
      distributionMode: campaigns.distributionMode,
    })
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

  const publicReceptionToken = await ensurePublicReceptionToken(campaignId);

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
      let type: "audio" | "image" | "file" = "file";

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
        libraryAssetId: ca.assetId || undefined,
      };
    })
  );

  const wfRows = await fetchWorkflowRecipientsForCampaign(campaignId, session.workspaceId);

  const distributionMode = owned[0].distributionMode ?? "per_link";

  const recipients = wfRows.map((row) => ({
    id: row.recipientSlotId || row.claimId,
    name: row.recipientDisplayName ?? "（無名）",
    listenerNote: row.listenerNote ?? undefined,
    tags: [] as string[],
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
    assignedFileIds: row.assignedFileIds,
    link:
      distributionMode === "reception"
        ? undefined
        : `/claim/${encodeURIComponent(row.claimSecret)}`,
    claimSecret: row.claimSecret,
    passkeyVerified: row.passkeyVerified,
    globalRecipientId: row.globalRecipientId ?? undefined,
  }));

  return NextResponse.json({
    campaign: {
      ...campaign,
      distributionMode,
      publicReceptionToken,
    },
    poolFiles,
    recipients,
  });
}
