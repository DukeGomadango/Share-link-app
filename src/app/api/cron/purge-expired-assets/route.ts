import { NextResponse } from "next/server";

import { purgeExpiredAssets } from "@/lib/assets/purge-expired";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Vercel Cron または手動（Authorization: Bearer CRON_SECRET） */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await purgeExpiredAssets();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("purge-expired-assets failed:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "purge failed" },
      { status: 500 }
    );
  }
}
