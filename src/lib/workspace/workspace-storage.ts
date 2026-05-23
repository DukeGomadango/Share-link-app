import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { assets, workspaces } from "@/db/schema";

import {
  effectiveStorageLimitBytes,
  normalizePlanTier,
  type PlanTier,
} from "./plan-limits";

export type WorkspaceStorageSnapshot = {
  workspaceId: string;
  planTier: PlanTier;
  billingTier: "pro" | "supporter" | null;
  usedBytes: number;
  limitBytes: number;
};

export type StorageQuotaCheckResult =
  | { ok: true; snapshot: WorkspaceStorageSnapshot }
  | {
      ok: false;
      snapshot: WorkspaceStorageSnapshot;
      error: "quota_exceeded";
    };

export async function getWorkspaceStorageSnapshot(
  workspaceId: string
): Promise<WorkspaceStorageSnapshot | null> {
  const db = getDb();
  const [workspace] = await db
    .select({
      planTier: workspaces.planTier,
      billingTier: workspaces.billingTier,
      storageLimit: workspaces.storageLimit,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    return null;
  }

  const [usage] = await db
    .select({
      totalBytes: sql<number>`COALESCE(SUM(${assets.sizeBytes}), 0)::bigint`,
    })
    .from(assets)
    .where(eq(assets.workspaceId, workspaceId));

  const planTier = normalizePlanTier(workspace.planTier);

  return {
    workspaceId,
    planTier,
    billingTier: workspace.billingTier ?? null,
    usedBytes: Number(usage?.totalBytes ?? 0),
    limitBytes: effectiveStorageLimitBytes(planTier, workspace.storageLimit),
  };
}

export async function assertWorkspaceCanStoreBytes(
  workspaceId: string,
  additionalBytes: number
): Promise<StorageQuotaCheckResult> {
  const snapshot = await getWorkspaceStorageSnapshot(workspaceId);
  if (!snapshot) {
    return {
      ok: false,
      snapshot: {
        workspaceId,
        planTier: "free",
        billingTier: null,
        usedBytes: 0,
        limitBytes: 0,
      },
      error: "quota_exceeded",
    };
  }

  if (snapshot.usedBytes + additionalBytes > snapshot.limitBytes) {
    return { ok: false, snapshot, error: "quota_exceeded" };
  }

  return { ok: true, snapshot };
}
