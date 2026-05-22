/** 外部連携トークンに付与する既定スコープ（発行・OAuth同意で共通） */
export const DEFAULT_INTEGRATION_SCOPES =
  "campaigns:read,campaigns:write,claims:issue";

export function parseIntegrationScopes(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 開発のみ: `INTEGRATION_SCOPE_BYPASS=true` でスコープ検証をスキップ */
export function integrationScopeBypassEnabled(): boolean {
  return process.env.INTEGRATION_SCOPE_BYPASS === "true";
}

/**
 * トークンが要求スコープを満たすか。
 * 旧トークン（`campaigns:write` 未付与・`claims:issue` のみ）は write を issue から許容（移行期間）。
 */
export function tokenHasScope(scopes: string[], required: string | null): boolean {
  if (!required) return true;
  if (integrationScopeBypassEnabled()) return true;
  if (scopes.includes(required)) return true;
  if (required === "campaigns:write" && scopes.includes("claims:issue")) {
    return true;
  }
  return false;
}
