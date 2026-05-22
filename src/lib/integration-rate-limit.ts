/**
 * 外部連携 API の簡易レート制限（プロセス単位。本番厳密化は Redis / Upstash 等へ）。
 */
const buckets = new Map<string, number[]>();

export function integrationRateLimit(
  integrationTokenId: string,
  max: number,
  windowMs: number
): boolean {
  const key = `integration:${integrationTokenId}`;
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

/** 既定: 1分あたり 120 リクエスト / トークン */
export const INTEGRATION_RATE_MAX = 120;
export const INTEGRATION_RATE_WINDOW_MS = 60_000;
