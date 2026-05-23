import { NextResponse } from "next/server";

import { decodeAssetListCursor, encodeAssetListCursor } from "@/lib/assets/asset-list-cursor";
import {
  LIBRARY_FILES_MAX_PAGE_SIZE,
  LIBRARY_FILES_PAGE_SIZE,
} from "@/lib/assets/library-list-config";
import {
  filtersAreActive,
  parseAssetListFilters,
} from "@/lib/assets/library-list-filters";
import {
  countAssetsMatchingFilters,
  fetchAssetsPage,
  fetchWorkspaceAssetCounts,
} from "@/lib/assets/workspace-library";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getWorkspaceStorageSnapshotCached } from "@/lib/workspace/storage-snapshot-cache";

function parseLimit(raw: string | null): number {
  if (!raw) return LIBRARY_FILES_PAGE_SIZE;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return LIBRARY_FILES_PAGE_SIZE;
  return Math.min(n, LIBRARY_FILES_MAX_PAGE_SIZE);
}

export async function GET(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  const cursorRaw = url.searchParams.get("cursor")?.trim();
  const cursor = cursorRaw ? decodeAssetListCursor(cursorRaw) : undefined;
  const filters = parseAssetListFilters(url.searchParams);

  if (cursorRaw && !cursor) {
    return NextResponse.json({ error: "invalid_cursor" }, { status: 400 });
  }

  const [snapshot, page, counts, filteredTotal] = await Promise.all([
    getWorkspaceStorageSnapshotCached(ctx.workspaceId),
    fetchAssetsPage(ctx.workspaceId, {
      limit,
      cursor: cursor ?? undefined,
      filters,
    }),
    fetchWorkspaceAssetCounts(ctx.workspaceId),
    filtersAreActive(filters)
      ? countAssetsMatchingFilters(ctx.workspaceId, filters)
      : Promise.resolve(null),
  ]);

  if (!snapshot) {
    return NextResponse.json({ error: "workspace_not_found" }, { status: 404 });
  }

  const files = page.rows.map((a) => ({
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
      billingTier: snapshot.billingTier,
      workspaceId: snapshot.workspaceId,
    },
    counts,
    filteredTotal,
    page: {
      hasMore: page.hasMore,
      nextCursor: page.nextCursor ? encodeAssetListCursor(page.nextCursor) : null,
      limit,
    },
  });
}
