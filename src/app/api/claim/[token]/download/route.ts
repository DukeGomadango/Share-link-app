import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { resolveClaimFileDownload } from "@/lib/claim/claim-file-download";
import { readR2Object } from "@/lib/storage/r2-storage";
import { readClaimSecretFromCookies } from "@/lib/webauthn/resolve-claim-session";
import { buildClaimBundleForSecret } from "@/lib/claim/bundle-for-token";

export const revalidate = 0;

type RouteParams = { params: Promise<{ token: string }> };

function contentDispositionAttachment(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_") || "download";
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const secret = decodeURIComponent(token).trim();
  if (!secret) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const fileId = new URL(request.url).searchParams.get("fileId")?.trim();
  if (!fileId) {
    return NextResponse.json({ error: "file_id_required" }, { status: 400 });
  }

  const initialBundle = await buildClaimBundleForSecret(secret);
  if (!initialBundle?.campaignId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const sessionSecret = readClaimSecretFromCookies(
    (name) => cookieStore.get(name)?.value,
    initialBundle.campaignId
  );

  const meta = await resolveClaimFileDownload(secret, fileId, sessionSecret);
  if (!meta) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const disposition = contentDispositionAttachment(meta.filename);

  if (meta.source.kind === "r2") {
    const object = await readR2Object(meta.source.objectKey);
    if (!object) {
      return NextResponse.json(
        { error: "storage_read_failed" },
        { status: 500 }
      );
    }
    const headers: Record<string, string> = {
      "Content-Type": meta.mimeType || object.contentType,
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
    };
    if (object.contentLength != null) {
      headers["Content-Length"] = String(object.contentLength);
    }
    return new NextResponse(object.body, { headers });
  }

  try {
    const upstream = await fetch(meta.source.url, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "upstream_fetch_failed" },
        { status: 502 }
      );
    }
    const contentType =
      upstream.headers.get("content-type") ?? meta.mimeType;
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "upstream_fetch_failed" },
      { status: 502 }
    );
  }
}
