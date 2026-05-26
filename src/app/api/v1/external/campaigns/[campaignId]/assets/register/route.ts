import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { assets, campaignAssets, campaigns, workspaces } from "@/db/schema";
import { assertObjectKeyBelongsToWorkspace } from "@/lib/assets/object-key";
import { resolveIntegrationBearer } from "@/lib/external-auth";
import { ensureCampaignToolIntegrationWritable } from "@/lib/external-integration-pause";
import { handleCorsPreflight, jsonWithCors } from "@/lib/external-cors";
import { getStorageBucket, MAX_UPLOAD_BYTES } from "@/lib/storage/config";
import { headR2Object } from "@/lib/storage/r2-storage";
import { validateUploadPolicy } from "@/lib/storage/upload-policy";
import {
  computeAssetExpiresAt,
  normalizePlanTier,
} from "@/lib/workspace/plan-limits";
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

  let body: {
    asset_id?: string;
    object_key?: string;
    filename?: string;
    size?: number;
    mime_type?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ error: "invalid_json" }, request, { status: 400 });
  }

  const assetId = body.asset_id?.trim();
  const objectKey = body.object_key?.trim();
  const originalFilename = body.filename?.trim();
  const sizeBytes = body.size;
  const mimeType = body.mime_type?.trim();

  if (!assetId || !objectKey || !originalFilename || typeof sizeBytes !== "number") {
    return jsonWithCors({ error: "invalid_input" }, request, { status: 400 });
  }
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1) {
    return jsonWithCors({ error: "invalid_size" }, request, { status: 400 });
  }

  if (!assertObjectKeyBelongsToWorkspace(auth.workspaceId, objectKey, assetId)) {
    return jsonWithCors({ error: "invalid_object_key" }, request, { status: 400 });
  }

  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return jsonWithCors({ error: "file_too_large" }, request, { status: 413 });
  }

  const resolvedMime = mimeType || "application/octet-stream";
  const uploadPolicy = validateUploadPolicy(originalFilename, resolvedMime);
  if (!uploadPolicy.ok) {
    return jsonWithCors(
      { error: uploadPolicy.error, message: uploadPolicy.message },
      request,
      { status: 400 }
    );
  }

  const uploadedObject = await headR2Object(objectKey);
  if (!uploadedObject || typeof uploadedObject.contentLength !== "number") {
    return jsonWithCors({ error: "object_not_found" }, request, { status: 400 });
  }
  if (uploadedObject.contentLength !== sizeBytes) {
    return jsonWithCors({ error: "size_mismatch" }, request, { status: 400 });
  }
  if (
    uploadedObject.contentType.split(";")[0].trim().toLowerCase() !==
    resolvedMime.split(";")[0].trim().toLowerCase()
  ) {
    return jsonWithCors({ error: "content_type_mismatch" }, request, { status: 400 });
  }

  const bucket = getStorageBucket();

  try {
    // 1. Library Assets に登録 (既にある場合はスキップ)
    const existing = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
    if (existing[0]?.workspaceId && existing[0].workspaceId !== auth.workspaceId) {
      return jsonWithCors(
        { error: "forbidden", message: "指定された素材はこのワークスペースに属していません" },
        request,
        { status: 403 }
      );
    }

    if (!existing[0]) {
      const quota = await assertWorkspaceCanStoreBytes(auth.workspaceId, sizeBytes);
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

      const workspace = await db
        .select({ planTier: workspaces.planTier })
        .from(workspaces)
        .where(eq(workspaces.id, auth.workspaceId))
        .limit(1)
        .then((rows) => rows[0]);

      const planTier = normalizePlanTier(workspace?.planTier);
      const expiresAt = computeAssetExpiresAt(planTier);

      await db.insert(assets).values({
        id: assetId,
        workspaceId: auth.workspaceId,
        bucket,
        objectKey,
        originalFilename,
        mimeType: mimeType || "application/octet-stream",
        sizeBytes,
        expiresAt,
      });
    }

    // 2. Campaign Assets に紐付け
    const campAssetId = crypto.randomUUID();
    await db.insert(campaignAssets).values({
      id: campAssetId,
      campaignId,
      assetId,
      label: originalFilename,
    });

    return jsonWithCors({
      id: campAssetId,
      asset_id: assetId,
      label: originalFilename,
      ok: true,
    }, request);
  } catch (err) {
    console.error("Failed to register external asset:", err);
    return jsonWithCors({ error: "internal_error", message: err instanceof Error ? err.message : "登録に失敗しました" }, request, { status: 500 });
  }
}
