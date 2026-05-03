/** 受取ページの絶対 URL のベース（`NEXT_PUBLIC_APP_URL` 優先） */
export function resolveClaimBaseUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env) {
    return env;
  }
  return new URL(request.url).origin;
}

export function buildClaimPageUrl(request: Request, claimSecret: string): string {
  return `${resolveClaimBaseUrl(request)}/claim/${encodeURIComponent(claimSecret)}`;
}
