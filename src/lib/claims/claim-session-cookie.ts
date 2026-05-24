import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

import {
  CLAIM_SESSION_COOKIE_LEGACY,
  CLAIM_SESSION_MAX_AGE_SEC,
  claimSessionCookieName,
} from "@/lib/claims/constants";

export function claimSessionCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CLAIM_SESSION_MAX_AGE_SEC,
  };
}

type CookieWriter = {
  set: (name: string, value: string, options?: Partial<ResponseCookie>) => void;
  delete: (name: string) => void;
};

/** 有効な受取リンク訪問時に claimSecret を Cookie へ保存する */
export function writeClaimSessionCookie(
  cookieStore: CookieWriter,
  campaignId: string,
  claimSecret: string
): void {
  cookieStore.set(
    claimSessionCookieName(campaignId),
    claimSecret,
    claimSessionCookieOptions()
  );
  cookieStore.delete(CLAIM_SESSION_COOKIE_LEGACY);
}
