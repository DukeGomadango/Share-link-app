import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { assets } from "@/db/schema";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { deleteStorageObject } from "@/lib/storage/delete-object";
import { applyWorkspaceStorageDelta } from "@/lib/workspace/workspace-storage";
import { invalidateWorkspaceStorageSnapshot } from "@/lib/workspace/storage-snapshot-cache";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await params;
  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const db = getDb();
  const result = await db
    .update(assets)
    .set({ originalFilename: name })
    .where(
      and(
        eq(assets.id, fileId),
        eq(assets.workspaceId, ctx.workspaceId)
      )
    )
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await params;
  const db = getDb();
  // 削除対象のアセット情報を取得
  const asset = await db.query.assets.findFirst({
    where: and(
      eq(assets.id, fileId),
      eq(assets.workspaceId, ctx.workspaceId)
    ),
  });

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  // 1. Storage から削除（R2 / Supabase を bucket で判別）
  await deleteStorageObject(asset.bucket, asset.objectKey);

  // 2. Database から削除
  try {
    const result = await db
      .delete(assets)
      .where(
        and(
          eq(assets.id, fileId),
          eq(assets.workspaceId, ctx.workspaceId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    await applyWorkspaceStorageDelta(ctx.workspaceId, -asset.sizeBytes);
    invalidateWorkspaceStorageSnapshot(ctx.workspaceId);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    // 外部キー制約（キャンペーンに紐づいている場合など）をハンドリング
    if (e && typeof e === "object" && "code" in e && e.code === "23503") {
      return NextResponse.json(
        { 
          error: "conflict", 
          message: "このファイルはキャンペーンで使用中のため削除できません。先にキャンペーンからの紐付けを解除してください。" 
        }, 
        { status: 409 }
      );
    }
    throw e;
  }
}
