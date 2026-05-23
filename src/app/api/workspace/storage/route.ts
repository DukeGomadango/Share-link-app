import { NextResponse } from "next/server";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getWorkspaceStorageSnapshotCached } from "@/lib/workspace/storage-snapshot-cache";

/** ストレージ使用量のみ（一覧と分離して取得する場合） */
export async function GET() {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getWorkspaceStorageSnapshotCached(ctx.workspaceId);
  if (!snapshot) {
    return NextResponse.json({ error: "workspace_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    usedBytes: snapshot.usedBytes,
    limitBytes: snapshot.limitBytes,
    planTier: snapshot.planTier,
    billingTier: snapshot.billingTier,
    workspaceId: snapshot.workspaceId,
  });
}
