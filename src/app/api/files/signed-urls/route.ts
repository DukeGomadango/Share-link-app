import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { createSignedReadUrl } from "@/lib/assets/signed-urls";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { assets } from "@/db/schema";
import {
  SIGNED_PREVIEW_EXPIRY_SECONDS,
  SIGNED_READ_EXPIRY_SECONDS,
} from "@/lib/storage/config";

const MAX_FILE_IDS = 40;

type Purpose = "preview" | "view";

function resolveExpiry(purpose: Purpose): number {
  return purpose === "preview"
    ? SIGNED_PREVIEW_EXPIRY_SECONDS
    : SIGNED_READ_EXPIRY_SECONDS;
}

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { fileIds?: unknown; purpose?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawIds = body.fileIds;
  if (!Array.isArray(rawIds)) {
    return NextResponse.json({ error: "fileIds_required" }, { status: 400 });
  }

  const fileIds = [...new Set(rawIds.filter((id): id is string => typeof id === "string"))]
    .slice(0, MAX_FILE_IDS);

  if (fileIds.length === 0) {
    return NextResponse.json({ urls: {}, purpose: "preview", expiresInSeconds: 0 });
  }

  const purpose: Purpose = body.purpose === "view" ? "view" : "preview";
  const expiresInSeconds = resolveExpiry(purpose);

  const db = getDb();
  const rows = await db
    .select({
      id: assets.id,
      bucket: assets.bucket,
      objectKey: assets.objectKey,
    })
    .from(assets)
    .where(
      and(eq(assets.workspaceId, ctx.workspaceId), inArray(assets.id, fileIds))
    );

  const urls: Record<string, string> = {};
  await Promise.all(
    rows.map(async (row) => {
      const url = await createSignedReadUrl(row.bucket, row.objectKey, {
        expiresInSeconds,
      });
      if (url) {
        urls[row.id] = url;
      }
    })
  );

  return NextResponse.json({
    urls,
    purpose,
    expiresInSeconds,
  });
}
