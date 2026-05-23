import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { createSignedReadUrl } from "@/lib/assets/signed-urls";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { assets } from "@/db/schema";
import {
  SIGNED_PREVIEW_EXPIRY_SECONDS,
  SIGNED_READ_EXPIRY_SECONDS,
} from "@/lib/storage/config";

type Purpose = "preview" | "view";

function resolveExpiry(purpose: Purpose): number {
  return purpose === "preview"
    ? SIGNED_PREVIEW_EXPIRY_SECONDS
    : SIGNED_READ_EXPIRY_SECONDS;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await params;
  const purposeParam = new URL(request.url).searchParams.get("purpose");
  const purpose: Purpose = purposeParam === "preview" ? "preview" : "view";

  const db = getDb();
  const row = await db.query.assets.findFirst({
    where: and(eq(assets.id, fileId), eq(assets.workspaceId, ctx.workspaceId)),
    columns: { bucket: true, objectKey: true, mimeType: true },
  });

  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const url = await createSignedReadUrl(row.bucket, row.objectKey, {
    expiresInSeconds: resolveExpiry(purpose),
  });

  if (!url) {
    return NextResponse.json(
      { error: "signed_url_failed", message: "署名付き URL の取得に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url,
    purpose,
    expiresInSeconds: resolveExpiry(purpose),
    mimeType: row.mimeType,
  });
}
