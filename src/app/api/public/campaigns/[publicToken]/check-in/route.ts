import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  CLAIM_SESSION_COOKIE_LEGACY,
  CLAIM_SESSION_MAX_AGE_SEC,
  claimSessionCookieName,
} from "@/lib/claims/constants";
import { createSlotAndClaim } from "@/lib/claims/create-slot-and-claim";
import { findClaimByRecipientInCampaign } from "@/lib/claims/find-claim-by-recipient-in-campaign";
import { findClaimForListenerResume } from "@/lib/claims/find-claim-for-listener-resume";
import { checkInRateLimit } from "@/lib/public/check-in-rate-limit";
import { getDb } from "@/db";
import { campaigns, claimAssets, claimIdentityLinks, claims, listenerIdentities, recipients, campaignAssets, campaignRecipientSlots, slotAssets } from "@/db/schema";
import {
  LISTENER_SESSION_COOKIE,
  verifyListenerSessionToken,
} from "@/lib/webauthn/listener-session-cookie";

type RouteParams = { params: Promise<{ publicToken: string }> };

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, ctx: RouteParams) {
  const { publicToken: rawToken } = await ctx.params;
  const publicToken = decodeURIComponent(rawToken ?? "").trim();
  if (!publicToken) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const db = getDb();
  const camp = await db
    .select({
      id: campaigns.id,
      distributionMode: campaigns.distributionMode,
      securityLevel: campaigns.securityLevel,
    })
    .from(campaigns)
    .where(eq(campaigns.publicReceptionToken, publicToken))
    .limit(1);

  const c = camp[0];
  if (!c || c.distributionMode !== "reception") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const cookieName = claimSessionCookieName(c.id);
  const secret = cookieStore.get(cookieName)?.value;

  if (secret) {
    // 既存の Claim を検索
    const existing = await db
      .select({ id: claims.id })
      .from(claims)
      .where(and(eq(claims.campaignId, c.id), eq(claims.claimSecret, secret)))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({
        ok: true,
        campaignId: c.id,
        claimId: existing[0].id,
        claimSecret: secret,
        securityLevel: c.securityLevel,
      });
    }
  }

  return NextResponse.json({ 
    ok: false, 
    message: "no_session",
    securityLevel: c.securityLevel,
  });
}

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
  if (!(await checkInRateLimit(`checkin:${publicToken}:${ip}`, MAX_PER_WINDOW, WINDOW_MS))) {
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
      workspaceId: campaigns.workspaceId,
      status: campaigns.status,
      expiresAt: campaigns.expiresAt,
      securityLevel: campaigns.securityLevel,
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

  const cookieStore = await cookies();
  const listenerTok = cookieStore.get(LISTENER_SESSION_COOKIE)?.value;
  const session = verifyListenerSessionToken(listenerTok);

  let created: { claimId: string; slotId: string; claimSecret: string };
  try {
    let recipientId: string | null = null;

    if (session && session.workspaceId === c.workspaceId) {
      // 既にパスキーで紐付いている既存の受取人 ID を DB から取得
      const [identity] = await db
        .select({ linkedRecipientId: listenerIdentities.linkedRecipientId })
        .from(listenerIdentities)
        .where(eq(listenerIdentities.id, session.listenerIdentityId))
        .limit(1);

      if (identity?.linkedRecipientId) {
        recipientId = identity.linkedRecipientId;
      }
    }

    if (!recipientId && displayName !== "ゲスト") {
      // 名前が入力されている場合のみ、グローバル名簿に受取人を自動登録
      const [newRecipient] = await db
        .insert(recipients)
        .values({
          workspaceId: c.workspaceId,
          name: displayName,
          tags: [],
        })
        .returning({ id: recipients.id });
      recipientId = newRecipient?.id ?? null;
    }

    let reused: { claimId: string; slotId: string; claimSecret: string } | null =
      null;

    if (session && session.workspaceId === c.workspaceId) {
      const resumed = await findClaimForListenerResume({
        listenerIdentityId: session.listenerIdentityId,
        campaignId: c.id,
        workspaceId: c.workspaceId,
      });
      if (resumed) {
        const [slotRow] = await db
          .select({ slotId: claims.recipientSlotId })
          .from(claims)
          .where(eq(claims.id, resumed.claimId))
          .limit(1);
        reused = {
          claimId: resumed.claimId,
          claimSecret: resumed.claimSecret,
          slotId: slotRow?.slotId ?? "",
        };
      }
    }

    if (!reused && recipientId) {
      const byRecipient = await findClaimByRecipientInCampaign(c.id, recipientId);
      if (byRecipient) {
        reused = {
          claimId: byRecipient.claimId,
          claimSecret: byRecipient.claimSecret,
          slotId: byRecipient.slotId,
        };
      }
    }

    if (reused) {
      created = {
        claimId: reused.claimId,
        slotId: reused.slotId || reused.claimId,
        claimSecret: reused.claimSecret,
      };
    } else {
      created = await createSlotAndClaim({
        campaignId: c.id,
        listenerDisplayName: displayName,
        listenerNote: body.note ?? null,
        recipientId,
      });

      // パスキー認証済みの場合、新しい Claim を自動的にアイデンティティと紐付ける
      if (session && session.workspaceId === c.workspaceId) {
        await db.insert(claimIdentityLinks).values({
          claimId: created.claimId,
          listenerIdentityId: session.listenerIdentityId,
        }).onConflictDoNothing();
      }

      // 公開モード (Standard) の場合、キャンペーンの全ファイルを自動紐付けする
      if (c.securityLevel === "standard") {
        const allAssets = await db
          .select({ id: campaignAssets.id })
          .from(campaignAssets)
          .where(eq(campaignAssets.campaignId, c.id));

        if (allAssets.length > 0) {
          await db.transaction(async (tx) => {
            await tx.insert(claimAssets).values(
              allAssets.map((a) => ({
                claimId: created.claimId,
                campaignAssetId: a.id,
              }))
            );

            await tx.insert(slotAssets).values(
              allAssets.map((a) => ({
                slotId: created.slotId,
                campaignAssetId: a.id,
              }))
            );

            await tx
              .update(campaignRecipientSlots)
              .set({ status: "ready" })
              .where(eq(campaignRecipientSlots.id, created.slotId));
          });
        }
      }
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "create_failed", message: "チェックインに失敗しました" },
      { status: 500 }
    );
  }

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
    claimSecret: created.claimSecret,
  });
}
