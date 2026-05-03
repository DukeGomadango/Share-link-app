/** 旧チェックイン（移行用・削除対象） */
export const CLAIM_SESSION_COOKIE_LEGACY = "fsa_claim_secret";

/** チェックイン後の claimSecret を載せる Cookie のプレフィックス + campaign UUID（Path は `/`） */
const CLAIM_COOKIE_PREFIX = "fsa_claim_";

export function claimSessionCookieName(campaignId: string): string {
  return `${CLAIM_COOKIE_PREFIX}${campaignId}`;
}

/** Cookie の maxAge（秒）— UI の「約○日」と一致させる */
export const CLAIM_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14;
