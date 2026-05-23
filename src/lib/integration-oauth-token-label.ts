/** authorize 画面から送るラベル（統一） */
export function oauthTokenLabel(clientId: string): string {
  return `OAuth: ${clientId.trim()}`;
}

/** 過去ラベル形式も含め同一 OAuth クライアントか */
export function isOAuthTokenForClient(label: string, clientId: string): boolean {
  const c = clientId.trim();
  if (!c) return false;
  const normalized = label.trim();
  return (
    normalized === oauthTokenLabel(c) ||
    normalized === `OAuth連携 (${c})` ||
    normalized === `OAuth (${c})`
  );
}
