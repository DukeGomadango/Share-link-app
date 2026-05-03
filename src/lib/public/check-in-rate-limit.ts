/**
 * インメモリの簡易レート制限（サーバレスではプロセス単位）。
 * 本番で厳密にやるなら Redis / Upstash 等へ。
 */
const buckets = new Map<string, number[]>();

export function checkInRateLimit(
  key: string,
  max: number,
  windowMs: number
): boolean {
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
