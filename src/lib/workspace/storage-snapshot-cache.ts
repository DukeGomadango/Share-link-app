import { revalidateTag, unstable_cache } from "next/cache";

import {
  getWorkspaceStorageSnapshot,
  type WorkspaceStorageSnapshot,
} from "@/lib/workspace/workspace-storage";

const CACHE_SECONDS = 60;

export function workspaceStorageCacheTag(workspaceId: string): string {
  return `workspace-storage:${workspaceId}`;
}

export async function getWorkspaceStorageSnapshotCached(
  workspaceId: string
): Promise<WorkspaceStorageSnapshot | null> {
  return unstable_cache(
    async () => getWorkspaceStorageSnapshot(workspaceId),
    ["workspace-storage-snapshot", workspaceId],
    {
      revalidate: CACHE_SECONDS,
      tags: [workspaceStorageCacheTag(workspaceId)],
    }
  )();
}

export function invalidateWorkspaceStorageSnapshot(workspaceId: string): void {
  revalidateTag(workspaceStorageCacheTag(workspaceId), { expire: 0 });
}
