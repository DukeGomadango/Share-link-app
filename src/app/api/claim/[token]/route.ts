import { NextResponse } from "next/server";
import { buildClaimBundleForSecret } from "@/lib/claim/bundle-for-token";

export const revalidate = 0;

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, ctx: RouteParams) {
  const { token } = await ctx.params;
  const secret = decodeURIComponent(token).trim();
  if (!secret) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const bundle = await buildClaimBundleForSecret(secret);
  if (!bundle) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(bundle);
}
