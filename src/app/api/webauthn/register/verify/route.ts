import {
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  CLAIM_SESSION_COOKIE_LEGACY,
  CLAIM_SESSION_MAX_AGE_SEC,
  claimSessionCookieName,
} from "@/lib/claims/constants";
import { getCampaignIdForClaimSecret } from "@/lib/claims/campaign-for-secret";
import { getWebAuthnRpConfig } from "@/lib/webauthn/config";
import {
  readClaimSecretFromCookies,
  resolveClaimSessionForCampaign,
} from "@/lib/webauthn/resolve-claim-session";
import { setListenerSessionCookieOnResponse } from "@/lib/webauthn/listener-session-cookie";
import { getDb } from "@/db";
import {
  campaignRecipientSlots,
  claimIdentityLinks,
  claims,
  listenerIdentities,
  recipients,
  webauthnChallenges,
  webauthnCredentials,
} from "@/db/schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RegBody = {
  campaignId?: string;
  challengeId?: string;
  credential?: RegistrationResponseJSON;
  displayName?: string;
};

export async function POST(request: Request) {
  let body: RegBody;
  try {
    body = (await request.json()) as RegBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const campaignId = body.campaignId?.trim();
  const challengeId = body.challengeId?.trim();
  const credential = body.credential;

  if (!campaignId || !UUID_RE.test(campaignId)) {
    return NextResponse.json({ error: "invalid_campaign_id" }, { status: 400 });
  }
  if (!challengeId || !UUID_RE.test(challengeId)) {
    return NextResponse.json({ error: "invalid_challenge_id" }, { status: 400 });
  }
  if (!credential) {
    return NextResponse.json({ error: "credential_required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const get = (n: string) => cookieStore.get(n)?.value;

  let secret =
    readClaimSecretFromCookies(
      get as (name: string) => string | undefined,
      campaignId
    ) || undefined;
  if (!secret) {
    const legacy = get(CLAIM_SESSION_COOKIE_LEGACY)?.trim();
    if (legacy && (await getCampaignIdForClaimSecret(legacy)) === campaignId) {
      secret = legacy;
      cookieStore.set(claimSessionCookieName(campaignId), secret, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: CLAIM_SESSION_MAX_AGE_SEC,
      });
      cookieStore.delete(CLAIM_SESSION_COOKIE_LEGACY);
    }
  }

  if (!secret) {
    return NextResponse.json({ error: "no_claim_session" }, { status: 401 });
  }

  const session = await resolveClaimSessionForCampaign(campaignId, secret);
  if (!session) {
    return NextResponse.json({ error: "invalid_session" }, { status: 401 });
  }

  const db = getDb();
  const now = new Date();

  const chRows = await db
    .select()
    .from(webauthnChallenges)
    .where(
      and(
        eq(webauthnChallenges.id, challengeId),
        eq(webauthnChallenges.purpose, "registration")
      )
    )
    .limit(1);

  const challengeRow = chRows[0];
  if (!challengeRow) {
    return NextResponse.json({ error: "challenge_not_found" }, { status: 400 });
  }
  if (challengeRow.expiresAt.getTime() < now.getTime()) {
    return NextResponse.json({ error: "challenge_expired" }, { status: 400 });
  }
  if (!challengeRow.listenerIdentityId || !challengeRow.claimId) {
    return NextResponse.json({ error: "invalid_challenge" }, { status: 400 });
  }
  if (challengeRow.claimId !== session.claimId) {
    return NextResponse.json({ error: "claim_mismatch" }, { status: 403 });
  }

  const { rpID, origin } = getWebAuthnRpConfig();

  let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "verification_failed";
    return NextResponse.json({ error: "verification_failed", message: msg }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "not_verified" }, { status: 400 });
  }

  const cred = verification.registrationInfo.credential;
  const publicKeyB64 = isoBase64URL.fromBuffer(cred.publicKey);
  const transports = cred.transports ?? [];

  try {
    await db.transaction(async (tx) => {
      await tx.insert(webauthnCredentials).values({
        listenerIdentityId: challengeRow.listenerIdentityId!,
        credentialId: cred.id,
        publicKey: publicKeyB64,
        counter: cred.counter,
        transports,
      });

      await tx.insert(claimIdentityLinks).values({
        claimId: challengeRow.claimId!,
        listenerIdentityId: challengeRow.listenerIdentityId!,
      });

      await tx
        .delete(webauthnChallenges)
        .where(eq(webauthnChallenges.id, challengeId));

      // パスキー認証した人を名簿と紐付ける
      // claim -> recipientSlotId -> slot.recipientId -> listener_identities.linked_recipient_id
      const [claimRow] = await tx
        .select({ recipientSlotId: claims.recipientSlotId })
        .from(claims)
        .where(eq(claims.id, challengeRow.claimId!))
        .limit(1);

      if (claimRow?.recipientSlotId) {
        const [slotRow] = await tx
          .select({ recipientId: campaignRecipientSlots.recipientId })
          .from(campaignRecipientSlots)
          .where(eq(campaignRecipientSlots.id, claimRow.recipientSlotId))
          .limit(1);

        if (slotRow) {
          let rid = slotRow.recipientId;

          // 名前の入力があり、かつ未紐付けの場合のみ新規作成
          if (!rid && body.displayName?.trim()) {
            const [newRec] = await tx
              .insert(recipients)
              .values({
                workspaceId: session.workspaceId,
                name: body.displayName.trim(),
                tags: [],
              })
              .returning({ id: recipients.id });
            
            if (newRec) {
              rid = newRec.id;
              // スロット側の情報を更新
              await tx
                .update(campaignRecipientSlots)
                .set({ 
                  recipientId: rid,
                  listenerDisplayName: body.displayName.trim()
                })
                .where(eq(campaignRecipientSlots.id, claimRow.recipientSlotId));
            }
          }

          if (rid) {
            await tx
              .update(listenerIdentities)
              .set({ linkedRecipientId: rid })
              .where(eq(listenerIdentities.id, challengeRow.listenerIdentityId!));
          }
        }
      }
    });
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e && e.code === "23505"
        ? "duplicate"
        : "persist_failed";
    return NextResponse.json({ error: code }, { status: 409 });
  }

  const res = NextResponse.json({ ok: true });
  setListenerSessionCookieOnResponse(
    res,
    challengeRow.listenerIdentityId!,
    session.workspaceId
  );
  return res;
}
