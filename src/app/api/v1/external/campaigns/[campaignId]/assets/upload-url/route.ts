import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { campaigns } from "@/db/schema";
import { createSignedUploadToStorage } from "@/lib/assets/signed-urls";
import { resolveIntegrationBearer } from "@/lib/external-auth";
import { ensureCampaignToolIntegrationWritable } from "@/lib/external-integration-pause";
import { handleCorsPreflight, jsonWithCors } from "@/lib/external-cors";
import { getStorageBucket, MAX_UPLOAD_BYTES } from "@/lib/storage/config";
import { sanitizeFilenameForStorage } from "@/lib/storage/sanitize-filename";
import { assertWorkspaceCanStoreBytes } from "@/lib/workspace/workspace-storage";

type RouteParams = { params: Promise<{ campaignId: string }> };

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request, ctx: RouteParams) {
  const auth = await resolveIntegrationBearer(request, "campaigns:write");
  if (auth instanceof Response) return auth;

  const { campaignId } = await ctx.params;
  const db = getDb();

  // キャンペーンの存在確認
  const camp = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, auth.workspaceId)))
    .limit(1);

  if (!camp[0]) {
    return jsonWithCors({ error: "not_found", message: "キャンペーンが見つかりません" }, request, { status: 404 });
  }

  const pauseBlock = await ensureCampaignToolIntegrationWritable(
    campaignId,
    auth.workspaceId,
    request
  );
  if (pauseBlock) return pauseBlock;

  let body: { filename?: string; size?: number; contentType?: string };
  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ error: "invalid_json" }, request, { status: 400 });
  }

  const filename = body.filename?.trim();
  const size = body.size;
  const contentType = body.contentType?.trim() || "application/octet-stream";

  if (!filename || typeof size !== "number" || size < 1) {
    return jsonWithCors({ error: "invalid_input", message: "filename と size が必要です" }, request, { status: 400 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return jsonWithCors({ error: "file_too_large" }, request, { status: 413 });
  }

  const quota = await assertWorkspaceCanStoreBytes(auth.workspaceId, size);
  if (!quota.ok) {
    return jsonWithCors(
      {
        error: "quota_exceeded",
        message: "ストレージ容量制限を超えています",
        used_bytes: quota.snapshot.usedBytes,
        limit_bytes: quota.snapshot.limitBytes,
        plan_tier: quota.snapshot.planTier,
      },
      request,
      { status: 403 }
    );
  }

  const assetId = randomUUID();
  const safe = sanitizeFilenameForStorage(filename);
  const bucket = getStorageBucket();
  const objectKey = `${auth.workspaceId}/${assetId}/${safe}`;

  const signed = await createSignedUploadToStorage(bucket, objectKey, {
    contentType,
  });
  if (!signed) {
    return jsonWithCors({ error: "internal_error", message: "署名付きURLの生成に失敗しました" }, request, { status: 500 });
  }

  return jsonWithCors({
    upload_url: signed.signedUrl,
    asset_id: assetId,
    object_key: objectKey,
    bucket,
    content_type: contentType,
  }, request);
}
