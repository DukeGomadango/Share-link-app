import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildClaimBundleForSecret } from "@/lib/claim/bundle-for-token";
import { readClaimSecretFromCookies } from "@/lib/webauthn/resolve-claim-session";

export const revalidate = 0;

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const secret = decodeURIComponent(token).trim();
  if (!secret) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  // クッキーからセッション情報を取得（もしあれば）
  // campaignId を特定するために一度バンドルを（未認証状態で）取得する必要がある
  const initialBundle = await buildClaimBundleForSecret(secret);
  if (!initialBundle) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const campaignId = initialBundle.campaignId;
  const cookieStore = await cookies();
  const sessionSecret = campaignId 
    ? readClaimSecretFromCookies((name) => cookieStore.get(name)?.value, campaignId)
    : undefined;

  // セッション情報を含めて再度取得（認証済みならファイルが含まれる）
  const bundle = await buildClaimBundleForSecret(secret, sessionSecret);
  
  return NextResponse.json(bundle);
}
