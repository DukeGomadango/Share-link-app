import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

import { getWebAuthnRpConfig } from "@/lib/webauthn/config";
import { getDb } from "@/db";
import { webauthnChallenges } from "@/db/schema";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export async function POST() {
  const { rpID, origin } = getWebAuthnRpConfig();

  const options = await generateAuthenticationOptions({
    rpID,
    timeout: 60000,
    userVerification: "preferred",
  });

  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  const db = getDb();
  const [row] = await db
    .insert(webauthnChallenges)
    .values({
      challenge: options.challenge,
      purpose: "authentication",
      expiresAt,
    })
    .returning({ id: webauthnChallenges.id });

  if (!row) {
    return NextResponse.json({ error: "challenge_failed" }, { status: 500 });
  }

  return NextResponse.json({
    options,
    challengeId: row.id,
    rpOrigin: origin,
  });
}
