import { and, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { integrationAccessTokens } from "@/db/schema";
import { isOAuthTokenForClient } from "@/lib/integration-oauth-token-label";

export { isOAuthTokenForClient, oauthTokenLabel } from "@/lib/integration-oauth-token-label";

/**
 * 同一ワークスペース・同一 OAuth クライアントの既存トークンを削除（再連携時のローテーション）。
 */
export async function revokeOAuthTokensForClient(
  workspaceId: string,
  clientId: string
): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: integrationAccessTokens.id, label: integrationAccessTokens.label })
    .from(integrationAccessTokens)
    .where(eq(integrationAccessTokens.workspaceId, workspaceId));

  const ids = rows
    .filter((r) => isOAuthTokenForClient(r.label, clientId))
    .map((r) => r.id);

  if (ids.length === 0) return 0;

  await db
    .delete(integrationAccessTokens)
    .where(
      and(
        eq(integrationAccessTokens.workspaceId, workspaceId),
        inArray(integrationAccessTokens.id, ids)
      )
    );

  return ids.length;
}

export type PruneOAuthKeepStrategy = "latest_created" | "latest_used";

/**
 * 重複 OAuth トークンを整理（最新1件以外を削除）。手動発行トークンは対象外。
 */
export async function pruneOAuthTokensForClient(
  workspaceId: string,
  clientId: string,
  keep: PruneOAuthKeepStrategy = "latest_used"
): Promise<{ removed: number; keptId: string | null }> {
  const db = getDb();
  const rows = await db
    .select({
      id: integrationAccessTokens.id,
      label: integrationAccessTokens.label,
      createdAt: integrationAccessTokens.createdAt,
      lastUsedAt: integrationAccessTokens.lastUsedAt,
    })
    .from(integrationAccessTokens)
    .where(eq(integrationAccessTokens.workspaceId, workspaceId));

  const oauthRows = rows.filter((r) => isOAuthTokenForClient(r.label, clientId));
  if (oauthRows.length <= 1) {
    return { removed: 0, keptId: oauthRows[0]?.id ?? null };
  }

  const sorted = [...oauthRows].sort((a, b) => {
    if (keep === "latest_used") {
      const aUsed = a.lastUsedAt?.getTime() ?? 0;
      const bUsed = b.lastUsedAt?.getTime() ?? 0;
      if (bUsed !== aUsed) return bUsed - aUsed;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const keepId = sorted[0]!.id;
  const removeIds = sorted.slice(1).map((r) => r.id);

  await db
    .delete(integrationAccessTokens)
    .where(
      and(
        eq(integrationAccessTokens.workspaceId, workspaceId),
        inArray(integrationAccessTokens.id, removeIds)
      )
    );

  return { removed: removeIds.length, keptId: keepId };
}
