import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getWebAuthnRpConfig } from "@/lib/webauthn/config";
import { setListenerSessionCookieOnResponse } from "@/lib/webauthn/listener-session-cookie";
import { getDb } from "@/db";
import {
  listenerIdentities,
  webauthnChallenges,
  webauthnCredentials,
} from "@/db/schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Body = {
  challengeId?: string;
  credential?: AuthenticationResponseJSON;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const challengeId = body.challengeId?.trim();
  const credential = body.credential;

  if (!challengeId || !UUID_RE.test(challengeId)) {
    return NextResponse.json({ error: "invalid_challenge_id" }, { status: 400 });
  }
  if (!credential) {
    return NextResponse.json({ error: "credential_required" }, { status: 400 });
  }

  const db = getDb();
  const now = new Date();

  const chRows = await db
    .select()
    .from(webauthnChallenges)
    .where(
      and(
        eq(webauthnChallenges.id, challengeId),
        eq(webauthnChallenges.purpose, "authentication")
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

  const credRows = await db
    .select({
      cred: webauthnCredentials,
      identity: listenerIdentities,
    })
    .from(webauthnCredentials)
    .innerJoin(
      listenerIdentities,
      eq(webauthnCredentials.listenerIdentityId, listenerIdentities.id)
    )
    .where(eq(webauthnCredentials.credentialId, credential.id))
    .limit(1);

  const hit = credRows[0];
  if (!hit) {
    return NextResponse.json({ error: "credential_unknown" }, { status: 400 });
  }

  const publicKey = isoBase64URL.toBuffer(hit.cred.publicKey);

  const { rpID, origin } = getWebAuthnRpConfig();

  let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: hit.cred.credentialId,
        publicKey,
        counter: hit.cred.counter,
      },
      requireUserVerification: false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "verification_failed";
    return NextResponse.json({ error: "verification_failed", message: msg }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "not_verified" }, { status: 400 });
  }

  const newCounter = verification.authenticationInfo.newCounter;

  await db.transaction(async (tx) => {
    await tx
      .update(webauthnCredentials)
      .set({ counter: newCounter })
      .where(eq(webauthnCredentials.id, hit.cred.id));

    await tx
      .delete(webauthnChallenges)
      .where(eq(webauthnChallenges.id, challengeId));
  });

  const res = NextResponse.json({
    ok: true,
    workspaceId: hit.identity.workspaceId,
  });
  setListenerSessionCookieOnResponse(
    res,
    hit.identity.id,
    hit.identity.workspaceId
  );
  return res;
}
