import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lt,
  notExists,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import type { AssetListCursor } from "@/lib/assets/asset-list-cursor";
import type { AssetListFilters } from "@/lib/assets/library-list-filters";
import { getDb } from "@/db";
import { assets, campaignAssets, campaigns } from "@/db/schema";

const MB = 1024 * 1024;

function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function unassignedAssetCondition(
  db: ReturnType<typeof getDb>,
  workspaceId: string
) {
  return notExists(
    db
      .select({ id: campaignAssets.id })
      .from(campaignAssets)
      .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
      .where(
        and(eq(campaignAssets.assetId, assets.id), eq(campaigns.workspaceId, workspaceId))
      )
  );
}

function buildAssetListConditions(
  db: ReturnType<typeof getDb>,
  workspaceId: string,
  filters?: AssetListFilters
): SQL[] {
  const parts: SQL[] = [eq(assets.workspaceId, workspaceId)];

  if (!filters) {
    return parts;
  }

  const q = filters.q?.trim();
  if (q) {
    parts.push(ilike(assets.originalFilename, `%${escapeIlikePattern(q)}%`));
  }

  if (filters.mimeCategory === "image") {
    parts.push(sql`${assets.mimeType} like 'image/%'`);
  } else if (filters.mimeCategory === "audio") {
    parts.push(sql`${assets.mimeType} like 'audio/%'`);
  }

  if (filters.unassignedOnly) {
    parts.push(unassignedAssetCondition(db, workspaceId));
  }

  if (filters.size === "small") {
    parts.push(lt(assets.sizeBytes, MB));
  } else if (filters.size === "medium") {
    parts.push(and(gte(assets.sizeBytes, MB), lt(assets.sizeBytes, 10 * MB))!);
  } else if (filters.size === "large") {
    parts.push(gte(assets.sizeBytes, 10 * MB));
  }

  if (filters.date) {
    const days = filters.date === "7d" ? 7 : filters.date === "30d" ? 30 : 90;
    const after = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    parts.push(gte(assets.createdAt, after));
  }

  const tag = filters.tag?.trim();
  if (tag && tag !== "all") {
    if (tag === "image") {
      parts.push(sql`${assets.mimeType} like 'image/%'`);
    } else if (tag === "audio") {
      parts.push(sql`${assets.mimeType} like 'audio/%'`);
    } else if (tag === "other") {
      parts.push(
        sql`${assets.mimeType} not like 'image/%' and ${assets.mimeType} not like 'audio/%'`
      );
    } else if (tag === "large") {
      parts.push(gte(assets.sizeBytes, 10 * MB));
    } else if (tag === "unassigned") {
      parts.push(unassignedAssetCondition(db, workspaceId));
    } else {
      parts.push(ilike(assets.originalFilename, `%${escapeIlikePattern(`.${tag}`)}`));
    }
  }

  return parts;
}

export async function countAssetsMatchingFilters(
  workspaceId: string,
  filters?: AssetListFilters
): Promise<number> {
  const db = getDb();
  const where = and(...buildAssetListConditions(db, workspaceId, filters));
  const [row] = await db.select({ total: count() }).from(assets).where(where);
  return Number(row?.total ?? 0);
}

export type WorkspaceAssetRow = typeof assets.$inferSelect;

export type WorkspaceAssetCounts = {
  total: number;
  unassigned: number;
};

async function attachCampaignLabels(
  workspaceId: string,
  assetRows: WorkspaceAssetRow[]
): Promise<Array<WorkspaceAssetRow & { linkedCampaigns: string[] }>> {
  const assetIds = assetRows.map((a) => a.id);
  if (assetIds.length === 0) {
    return [];
  }

  const db = getDb();
  const links = await db
    .select({
      assetId: campaignAssets.assetId,
      campaignName: campaigns.name,
    })
    .from(campaignAssets)
    .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
    .where(
      and(eq(campaigns.workspaceId, workspaceId), inArray(campaignAssets.assetId, assetIds))
    );

  const map = new Map<string, string[]>();
  for (const link of links) {
    if (!link.assetId) continue;
    const list = map.get(link.assetId) ?? [];
    list.push(link.campaignName);
    map.set(link.assetId, list);
  }

  return assetRows.map((asset) => ({
    ...asset,
    linkedCampaigns: map.get(asset.id) ?? [],
  }));
}

export async function fetchWorkspaceAssetCounts(
  workspaceId: string
): Promise<WorkspaceAssetCounts> {
  const db = getDb();
  const [[totalRow], assignedRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(assets)
      .where(eq(assets.workspaceId, workspaceId)),
    db
      .selectDistinct({ assetId: campaignAssets.assetId })
      .from(campaignAssets)
      .innerJoin(campaigns, eq(campaignAssets.campaignId, campaigns.id))
      .where(
        and(eq(campaigns.workspaceId, workspaceId), isNotNull(campaignAssets.assetId))
      ),
  ]);

  const total = Number(totalRow?.total ?? 0);
  const assignedCount = assignedRows.filter((r) => r.assetId).length;

  return {
    total,
    unassigned: Math.max(0, total - assignedCount),
  };
}

export async function fetchAssetsPage(
  workspaceId: string,
  options: { limit: number; cursor?: AssetListCursor; filters?: AssetListFilters }
): Promise<{
  rows: Array<WorkspaceAssetRow & { linkedCampaigns: string[] }>;
  hasMore: boolean;
  nextCursor: AssetListCursor | null;
}> {
  const db = getDb();
  const { limit, cursor, filters } = options;

  const conditions = buildAssetListConditions(db, workspaceId, filters);
  if (cursor) {
    conditions.push(
      or(
        lt(assets.createdAt, cursor.createdAt),
        and(eq(assets.createdAt, cursor.createdAt), lt(assets.id, cursor.id))
      )!
    );
  }

  const whereClause = and(...conditions);

  const rows = await db
    .select({ asset: assets })
    .from(assets)
    .where(whereClause)
    .orderBy(desc(assets.createdAt), desc(assets.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const assetsOnly = pageRows.map((r) => r.asset);
  const withLabels = await attachCampaignLabels(workspaceId, assetsOnly);

  const last = withLabels[withLabels.length - 1];
  const nextCursor =
    hasMore && last
      ? { createdAt: last.createdAt, id: last.id }
      : null;

  return { rows: withLabels, hasMore, nextCursor };
}

/** @deprecated 全件取得。ページネーション版は fetchAssetsPage を使用 */
export async function fetchAssetsWithCampaignLabels(
  workspaceId: string
): Promise<Array<WorkspaceAssetRow & { linkedCampaigns: string[] }>> {
  const all: Array<WorkspaceAssetRow & { linkedCampaigns: string[] }> = [];
  let cursor: AssetListCursor | undefined;
  let hasMore = true;

  while (hasMore) {
    const page = await fetchAssetsPage(workspaceId, {
      limit: 200,
      cursor,
      filters: undefined,
    });
    all.push(...page.rows);
    hasMore = page.hasMore;
    cursor = page.nextCursor ?? undefined;
  }

  return all;
}

/** campaign のワークスペース一致を確認してから campaign_assets を削除（アサイン解除） */
export async function deleteCampaignAssetLinks(args: {
  workspaceId: string;
  campaignId: string;
  assetIds: string[];
}): Promise<number> {
  const { workspaceId, campaignId, assetIds } = args;
  if (assetIds.length === 0) {
    return 0;
  }
  const db = getDb();
  const row = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId)))
    .limit(1);
  if (!row[0]) {
    return 0;
  }

  const result = await db
    .delete(campaignAssets)
    .where(
      and(
        eq(campaignAssets.campaignId, campaignId),
        inArray(campaignAssets.assetId, assetIds)
      )
    )
    .returning({ id: campaignAssets.id });

  return result.length;
}