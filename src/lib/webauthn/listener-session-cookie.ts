import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "fsa_listener";

function secretKey(): string {
  return (
    process.env.WEBAUTHN_SESSION_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "dev-only-change-in-production"
  );
}

export type ListenerSessionPayload = {
  listenerIdentityId: string;
  workspaceId: string;
  exp: number;
};

export function createListenerSessionToken(payload: ListenerSessionPayload): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const sig = createHmac("sha256", secretKey())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyListenerSessionToken(
  token: string | undefined
): ListenerSessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secretKey())
    .update(payloadB64)
    .digest("base64url");
  try {
    if (
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const raw = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as ListenerSessionPayload;
    if (
      typeof raw.listenerIdentityId !== "string" ||
      typeof raw.workspaceId !== "string" ||
      typeof raw.exp !== "number"
    ) {
      return null;
    }
    if (raw.exp < Math.floor(Date.now() / 1000)) return null;
    return raw;
  } catch {
    return null;
  }
}

export const LISTENER_SESSION_COOKIE = COOKIE_NAME;
export const LISTENER_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

/** Route Handler の `NextResponse` に HttpOnly リスナーセッションを付与する */
export function setListenerSessionCookieOnResponse(
  res: {
    cookies: {
      set: (
        name: string,
        value: string,
        options: {
          httpOnly?: boolean;
          sameSite?: "lax" | "strict" | "none";
          secure?: boolean;
          path?: string;
          maxAge?: number;
        }
      ) => void;
    };
  },
  listenerIdentityId: string,
  workspaceId: string
): void {
  const exp = Math.floor(Date.now() / 1000) + LISTENER_SESSION_MAX_AGE_SEC;
  const token = createListenerSessionToken({
    listenerIdentityId,
    workspaceId,
    exp,
  });
  res.cookies.set(LISTENER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LISTENER_SESSION_MAX_AGE_SEC,
  });
}
