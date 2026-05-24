import { generateRegistrationOptions } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
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
import { uuidToUint8Array } from "@/lib/webauthn/uuid-bytes";
import { getDb } from "@/db";
import {
  claimIdentityLinks,
  listenerIdentities,
  webauthnChallenges,
} from "@/db/schema";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: { campaignId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const campaignId = body.campaignId?.trim();
  if (!campaignId || !UUID_RE.test(campaignId)) {
    return NextResponse.json({ error: "invalid_campaign_id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const get = (n: string) => cookieStore.get(n)?.value;

  let secret =
    readClaimSecretFromCookies(get as (name: string) => string | undefined, campaignId) ||
    undefined;
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
  const linked = await db
    .select({ claimId: claimIdentityLinks.claimId })
    .from(claimIdentityLinks)
    .where(eq(claimIdentityLinks.claimId, session.claimId))
    .limit(1);

  if (linked[0]) {
    return NextResponse.json(
      { error: "already_registered", message: "この受け取りには既に登録済みです" },
      { status: 409 }
    );
  }

  const [identity] = await db
    .insert(listenerIdentities)
    .values({ workspaceId: session.workspaceId })
    .returning({ id: listenerIdentities.id });

  if (!identity) {
    return NextResponse.json({ error: "identity_create_failed" }, { status: 500 });
  }

  const { rpID, rpName, origin } = getWebAuthnRpConfig();

  const userIdBytes = new Uint8Array(16);
  userIdBytes.set(uuidToUint8Array(identity.id));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: userIdBytes,
    userName: `fan-${identity.id.slice(0, 8)}`,
    userDisplayName: session.displayName.slice(0, 64),
    timeout: 60000,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
  });

  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  const [chRow] = await db
    .insert(webauthnChallenges)
    .values({
      challenge: options.challenge,
      purpose: "registration",
      expiresAt,
      claimId: session.claimId,
      listenerIdentityId: identity.id,
      workspaceId: session.workspaceId,
    })
    .returning({ id: webauthnChallenges.id });

  if (!chRow) {
    return NextResponse.json({ error: "challenge_failed" }, { status: 500 });
  }

  return NextResponse.json({
    options,
    challengeId: chRow.id,
    rpOrigin: origin,
  });
}
