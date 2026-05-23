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
      storageUsedBytes: workspaces.storageUsedBytes,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    return null;
  }

  const planTier = normalizePlanTier(workspace.planTier);

  return {
    workspaceId,
    planTier,
    billingTier: workspace.billingTier ?? null,
    usedBytes: Number(workspace.storageUsedBytes ?? 0),
    limitBytes: effectiveStorageLimitBytes(planTier, workspace.storageLimit),
  };
}

export async function applyWorkspaceStorageDelta(
  workspaceId: string,
  deltaBytes: number
): Promise<void> {
  if (deltaBytes === 0) {
    return;
  }
  const db = getDb();
  if (deltaBytes > 0) {
    await db
      .update(workspaces)
      .set({
        storageUsedBytes: sql`${workspaces.storageUsedBytes} + ${deltaBytes}`,
      })
      .where(eq(workspaces.id, workspaceId));
    return;
  }

  const remove = Math.abs(deltaBytes);
  await db
    .update(workspaces)
    .set({
      storageUsedBytes: sql`GREATEST(0, ${workspaces.storageUsedBytes} - ${remove})`,
    })
    .where(eq(workspaces.id, workspaceId));
}

/** 使用量カラムを assets から再計算（修復用） */
export async function recomputeWorkspaceStorageUsedBytes(workspaceId: string): Promise<void> {
  const db = getDb();
  const [usage] = await db
    .select({
      totalBytes: sql<number>`COALESCE(SUM(${assets.sizeBytes}), 0)::bigint`,
    })
    .from(assets)
    .where(eq(assets.workspaceId, workspaceId));

  await db
    .update(workspaces)
    .set({ storageUsedBytes: Number(usage?.totalBytes ?? 0) })
    .where(eq(workspaces.id, workspaceId));
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
