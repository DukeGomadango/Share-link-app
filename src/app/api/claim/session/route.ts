import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildClaimBundleForSecret } from "@/lib/claim/bundle-for-token";
import { getCampaignIdForClaimSecret } from "@/lib/claims/campaign-for-secret";
import {
  CLAIM_SESSION_COOKIE_LEGACY,
  CLAIM_SESSION_MAX_AGE_SEC,
  claimSessionCookieName,
} from "@/lib/claims/constants";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId")?.trim();
  if (!campaignId) {
    return NextResponse.json(
      { error: "campaign_id_required", message: "campaignId が必要です" },
      { status: 400 }
    );
  }
  if (!UUID_RE.test(campaignId)) {
    return NextResponse.json({ error: "invalid_campaign_id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const scopedName = claimSessionCookieName(campaignId);
  let secret =
    cookieStore.get(scopedName)?.value?.trim() ||
    null;

  if (!secret) {
    const legacy = cookieStore.get(CLAIM_SESSION_COOKIE_LEGACY)?.value?.trim();
    if (legacy) {
      const legacyCampaign = await getCampaignIdForClaimSecret(legacy);
      if (legacyCampaign === campaignId) {
        secret = legacy;
        cookieStore.set(scopedName, secret, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: CLAIM_SESSION_MAX_AGE_SEC,
        });
        cookieStore.delete(CLAIM_SESSION_COOKIE_LEGACY);
      }
    }
  }

  if (!secret) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const resolved = await getCampaignIdForClaimSecret(secret);
  if (resolved !== campaignId) {
    return NextResponse.json({ error: "session_mismatch" }, { status: 401 });
  }

  const bundle = await buildClaimBundleForSecret(secret);
  if (!bundle) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(bundle);
}
