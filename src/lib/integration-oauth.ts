/** Step D: 連携クライアント ID（カンマ区切り）。未設定時は開発・本番の既定クライアントを許可 */
export function isAllowedIntegrationClientId(clientId: string | null): boolean {
  if (!clientId?.trim()) {
    return false;
  }
  const raw = process.env.INTEGRATION_ALLOWED_CLIENT_IDS;
  const allowed = raw
    ? raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : ["dango-tools-gacha", "dango-tools-dev"];
  return allowed.includes(clientId.trim());
}

/**
 * リダイレクト先 URI を許可リストと照合する。
 * `INTEGRATION_REDIRECT_ORIGINS` にカンマ区切りで **origin**（例: http://localhost:3000）を列挙。
 * 未設定時は localhost / 127.0.0.1 の http のみ許可（開発用）。
 */
export function isRedirectUriAllowed(redirectUri: string): boolean {
  try {
    const u = new URL(redirectUri);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return false;
    }
    const raw = process.env.INTEGRATION_REDIRECT_ORIGINS;
    const origins = raw
      ? raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : ["http://localhost:3000", "http://127.0.0.1:3000"];
    return origins.some((o) => {
      try {
        return u.origin === new URL(o).origin;
      } catch {
        return u.origin === o;
      }
    });
  } catch {
    return false;
  }
}

/** OAuth 2.0 風: ユーザーが拒否したとき連携元へ返すクエリ */
export const OAUTH_ERROR_ACCESS_DENIED = "access_denied";

export function buildOAuthDenyRedirectUrl(
  redirectUri: string,
  state?: string
): string | null {
  if (!isRedirectUriAllowed(redirectUri)) {
    return null;
  }
  const u = new URL(redirectUri);
  u.searchParams.set("error", OAUTH_ERROR_ACCESS_DENIED);
  if (state?.trim()) {
    u.searchParams.set("state", state.trim());
  }
  return u.toString();
}
