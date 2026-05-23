import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { assertObjectKeyBelongsToWorkspace } from "@/lib/assets/object-key";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { assets, workspaces } from "@/db/schema";
import { getStorageBucket, MAX_UPLOAD_BYTES } from "@/lib/storage/config";
import {
  computeAssetExpiresAt,
  normalizePlanTier,
} from "@/lib/workspace/plan-limits";
import { assertWorkspaceCanStoreBytes } from "@/lib/workspace/workspace-storage";

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    assetId?: string;
    objectKey?: string;
    originalFilename?: string;
    sizeBytes?: number;
    mimeType?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const assetId = body.assetId?.trim();
  const objectKey = body.objectKey?.trim();
  const originalFilename = body.originalFilename?.trim();
  const sizeBytes = body.sizeBytes;
  const mimeType = body.mimeType?.trim();

  if (!assetId || !objectKey || !originalFilename || typeof sizeBytes !== "number") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!assertObjectKeyBelongsToWorkspace(ctx.workspaceId, objectKey, assetId)) {
    return NextResponse.json({ error: "invalid_object_key" }, { status: 400 });
  }

  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const db = getDb();
  const bucket = getStorageBucket();

  const existing = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  if (existing[0]) {
    if (existing[0].workspaceId !== ctx.workspaceId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ id: assetId, ok: true, dedup: true });
  }

  const quota = await assertWorkspaceCanStoreBytes(ctx.workspaceId, sizeBytes);
  if (!quota.ok) {
    return NextResponse.json(
      {
        error: "quota_exceeded",
        message:
          "ストレージ容量制限を超えています。不要なファイルを削除するか Pro プランをご検討ください。",
        usedBytes: quota.snapshot.usedBytes,
        limitBytes: quota.snapshot.limitBytes,
        planTier: quota.snapshot.planTier,
      },
      { status: 403 }
    );
  }

  const [workspace] = await db
    .select({ planTier: workspaces.planTier })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1);

  const planTier = normalizePlanTier(workspace?.planTier);
  const expiresAt = computeAssetExpiresAt(planTier);

  await db.insert(assets).values({
    id: assetId,
    workspaceId: ctx.workspaceId,
    bucket,
    objectKey,
    originalFilename,
    mimeType: mimeType || "application/octet-stream",
    sizeBytes,
    expiresAt,
  });

  return NextResponse.json({ id: assetId, ok: true, dedup: false });
}
