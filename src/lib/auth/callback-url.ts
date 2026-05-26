/**
 * OAuth 完了後のリダイレクト先（/auth/callback）に `next` を付与する。
 * クライアントでは origin を、SSR では NEXT_PUBLIC_APP_URL を参照する。
 */
export function normalizeAuthNextPath(
  nextPath: string | null | undefined,
  fallback = "/dashboard",
): string {
  const value = nextPath?.trim();
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  if (/[\u0000-\u001F\u007F]/.test(value)) {
    return fallback;
  }
  return value;
}

export function getAuthCallbackUrl(nextPath: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL が未設定です。サーバー側で OAuth リダイレクト URL を組み立てられません。",
    );
  }
  return `${base}/auth/callback?next=${encodeURIComponent(normalizeAuthNextPath(nextPath))}`;
}
