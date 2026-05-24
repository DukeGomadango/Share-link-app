import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildClaimBundleForSecret } from "@/lib/claim/bundle-for-token";
import { writeClaimSessionCookie } from "@/lib/claims/claim-session-cookie";
import { readClaimSecretFromCookies } from "@/lib/webauthn/resolve-claim-session";

export const revalidate = 0;

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const secret = decodeURIComponent(token).trim();
  if (!secret) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const initialBundle = await buildClaimBundleForSecret(secret);
  if (!initialBundle) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const campaignId = initialBundle.campaignId;
  const cookieStore = await cookies();

  if (campaignId) {
    writeClaimSessionCookie(cookieStore, campaignId, secret);
  }

  const sessionSecret = campaignId
    ? readClaimSecretFromCookies((name) => cookieStore.get(name)?.value, campaignId)
    : undefined;

  const bundle = await buildClaimBundleForSecret(secret, sessionSecret);

  return NextResponse.json(bundle);
}
