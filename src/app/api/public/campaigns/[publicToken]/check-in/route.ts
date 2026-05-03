import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  CLAIM_SESSION_COOKIE_LEGACY,
  CLAIM_SESSION_MAX_AGE_SEC,
  claimSessionCookieName,
} from "@/lib/claims/constants";
import { createSlotAndClaim } from "@/lib/claims/create-slot-and-claim";
import { checkInRateLimit } from "@/lib/public/check-in-rate-limit";
import { getDb } from "@/db";
import { campaigns } from "@/db/schema";

type RouteParams = { params: Promise<{ publicToken: string }> };

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, ctx: RouteParams) {
  const { publicToken: rawToken } = await ctx.params;
  const publicToken = decodeURIComponent(rawToken ?? "").trim();
  if (!publicToken) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!checkInRateLimit(`checkin:${publicToken}:${ip}`, MAX_PER_WINDOW, WINDOW_MS)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { displayName?: string; note?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const displayName = body.displayName?.trim();
  if (!displayName) {
    return NextResponse.json(
      { error: "invalid_body", message: "displayName が必要です" },
      { status: 400 }
    );
  }

  const db = getDb();
  const camp = await db
    .select({
      id: campaigns.id,
      status: campaigns.status,
      expiresAt: campaigns.expiresAt,
      distributionMode: campaigns.distributionMode,
    })
    .from(campaigns)
    .where(eq(campaigns.publicReceptionToken, publicToken))
    .limit(1);

  const c = camp[0];
  if (!c) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (!UUID_RE.test(c.id)) {
    return NextResponse.json({ error: "invalid_campaign" }, { status: 500 });
  }

  if (c.distributionMode !== "reception") {
    return NextResponse.json(
      { error: "not_reception", message: "このキャンペーンは受付モードではありません" },
      { status: 400 }
    );
  }

  if (c.status !== "active") {
    return NextResponse.json(
      { error: "campaign_inactive", message: "キャンペーンが有効ではありません" },
      { status: 400 }
    );
  }

  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "campaign_expired", message: "キャンペーンの期限が切れています" },
      { status: 400 }
    );
  }

  let created;
  try {
    created = await createSlotAndClaim({
      campaignId: c.id,
      listenerDisplayName: displayName,
      listenerNote: body.note ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "create_failed", message: "チェックインに失敗しました" },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const name = claimSessionCookieName(c.id);
  cookieStore.set(name, created.claimSecret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CLAIM_SESSION_MAX_AGE_SEC,
  });
  cookieStore.delete(CLAIM_SESSION_COOKIE_LEGACY);

  return NextResponse.json({
    ok: true,
    claimId: created.claimId,
    campaignId: c.id,
  });
}
