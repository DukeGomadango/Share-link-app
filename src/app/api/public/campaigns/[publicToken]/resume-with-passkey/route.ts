import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  CLAIM_SESSION_COOKIE_LEGACY,
  CLAIM_SESSION_MAX_AGE_SEC,
  claimSessionCookieName,
} from "@/lib/claims/constants";
import { findClaimForListenerResume } from "@/lib/claims/find-claim-for-listener-resume";
import { checkInRateLimit } from "@/lib/public/check-in-rate-limit";
import {
  LISTENER_SESSION_COOKIE,
  verifyListenerSessionToken,
} from "@/lib/webauthn/listener-session-cookie";
import { getDb } from "@/db";
import { campaigns, listenerIdentities, recipients } from "@/db/schema";

type RouteParams = { params: Promise<{ publicToken: string }> };

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

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
  if (!checkInRateLimit(`resume:${publicToken}:${ip}`, MAX_PER_WINDOW, WINDOW_MS)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const listenerTok = cookieStore.get(LISTENER_SESSION_COOKIE)?.value;
  const session = verifyListenerSessionToken(listenerTok);
  if (!session) {
    return NextResponse.json(
      { error: "no_listener_session", message: "リスナーセッションがありません" },
      { status: 401 }
    );
  }

  const db = getDb();
  const campRows = await db
    .select({
      id: campaigns.id,
      workspaceId: campaigns.workspaceId,
      status: campaigns.status,
      expiresAt: campaigns.expiresAt,
      distributionMode: campaigns.distributionMode,
    })
    .from(campaigns)
    .where(eq(campaigns.publicReceptionToken, publicToken))
    .limit(1);

  const camp = campRows[0];
  if (!camp) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (camp.workspaceId !== session.workspaceId) {
    return NextResponse.json(
      { error: "workspace_mismatch", message: "別ワークスペースのキャンペーンです" },
      { status: 403 }
    );
  }

  if (camp.distributionMode !== "reception") {
    return NextResponse.json(
      { error: "not_reception", message: "このキャンペーンは受付モードではありません" },
      { status: 400 }
    );
  }

  if (camp.status !== "active") {
    return NextResponse.json(
      { error: "campaign_inactive", message: "キャンペーンが有効ではありません" },
      { status: 400 }
    );
  }

  if (camp.expiresAt && camp.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "campaign_expired", message: "キャンペーンの期限が切れています" },
      { status: 400 }
    );
  }

  const resolved = await findClaimForListenerResume({
    listenerIdentityId: session.listenerIdentityId,
    campaignId: camp.id,
    workspaceId: session.workspaceId,
  });

  if (!resolved) {
    // クレームは見つからなかったが、アイデンティティ（名簿との紐付け）は判明している場合
    // 名前を返して、フロントエンドで「おかえりなさい、〇〇さん」と表示できるようにする
    const [identity] = await db
      .select({ linkedRecipientId: listenerIdentities.linkedRecipientId })
      .from(listenerIdentities)
      .where(eq(listenerIdentities.id, session.listenerIdentityId))
      .limit(1);

    const identityName = identity?.linkedRecipientId
      ? await db
          .select({ name: recipients.name })
          .from(recipients)
          .where(eq(recipients.id, identity.linkedRecipientId))
          .limit(1)
          .then((rows) => rows[0]?.name)
      : undefined;

    return NextResponse.json(
      {
        error: "no_resumable_claim",
        message: "このキャンペーンで再開できる受け取りがありません",
        detectedName: identityName,
      },
      { status: 200 } // ユーザー判明時は 200 で返してフロントで処理しやすくする
    );
  }

  cookieStore.set(claimSessionCookieName(camp.id), resolved.claimSecret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CLAIM_SESSION_MAX_AGE_SEC,
  });
  cookieStore.delete(CLAIM_SESSION_COOKIE_LEGACY);

  return NextResponse.json({
    ok: true,
    campaignId: camp.id,
    claimId: resolved.claimId,
  });
}
