import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildClaimBundleForSecret } from "@/lib/claim/bundle-for-token";
import { CLAIM_SESSION_COOKIE } from "@/lib/claims/constants";

export async function GET() {
  const cookieStore = await cookies();
  const secret = cookieStore.get(CLAIM_SESSION_COOKIE)?.value?.trim();
  if (!secret) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const bundle = await buildClaimBundleForSecret(secret);
  if (!bundle) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(bundle);
}
