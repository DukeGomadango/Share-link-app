import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createSignedUploadToStorage } from "@/lib/assets/signed-urls";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStorageBucket, MAX_UPLOAD_BYTES } from "@/lib/storage/config";
import { sanitizeFilenameForStorage } from "@/lib/storage/sanitize-filename";

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getSupabaseAdmin()) {
    return NextResponse.json(
      {
        error: "service_unavailable",
        message:
          "SUPABASE_SERVICE_ROLE_KEY が未設定のため署名付きアップロード URL を発行できません",
      },
      { status: 503 }
    );
  }

  let body: { filename?: string; size?: number; contentType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const filename = body.filename?.trim();
  const size = body.size;
  const contentType = body.contentType?.trim() || "application/octet-stream";

  if (!filename || typeof size !== "number" || size < 1) {
    return NextResponse.json(
      { error: "filename と size が必要です" },
      { status: 400 }
    );
  }
  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const assetId = randomUUID();
  const safe = sanitizeFilenameForStorage(filename);
  const bucket = getStorageBucket();
  const objectKey = `${ctx.workspaceId}/${assetId}/${safe}`;

  const signed = await createSignedUploadToStorage(bucket, objectKey);
  if (!signed) {
    return NextResponse.json(
      { error: "signed_upload_failed", message: "署名付きアップロード URL の取得に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    uploadUrl: signed.signedUrl,
    path: signed.path,
    token: signed.token,
    assetId,
    objectKey,
    bucket,
    contentType,
  });
}
