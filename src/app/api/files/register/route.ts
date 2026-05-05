import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { assertObjectKeyBelongsToWorkspace } from "@/lib/assets/object-key";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { assets, workspaces } from "@/db/schema";
import { getStorageBucket, MAX_UPLOAD_BYTES } from "@/lib/storage/config";

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

  // ワークスペースのプラン情報を取得して保持期限を計算 (free: 90日, pro: 365日)
  const workspace = await db
    .select({ planTier: workspaces.planTier })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1)
    .then((rows) => rows[0]);

  const retentionDays = workspace?.planTier === "pro" ? 365 : 90;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + retentionDays);

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
