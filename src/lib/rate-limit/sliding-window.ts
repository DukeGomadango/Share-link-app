import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const memoryBuckets = new Map<string, number[]>();

const limiterCache = new Map<string, Ratelimit>();

function windowLabel(windowMs: number): `${number} ms` | `${number} s` | `${number} m` {
  if (windowMs % 60_000 === 0) {
    return `${windowMs / 60_000} m`;
  }
  if (windowMs % 1000 === 0) {
    return `${windowMs / 1000} s`;
  }
  return `${windowMs} ms`;
}

function getUpstashLimiter(max: number, windowMs: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    return null;
  }

  const cacheKey = `${max}:${windowMs}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const redis = new Redis({ url, token });
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, windowLabel(windowMs)),
    prefix: "fsl",
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

function memoryRateLimitAllowed(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (memoryBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    memoryBuckets.set(key, arr);
    return false;
  }
  arr.push(now);
  memoryBuckets.set(key, arr);
  return true;
}

/**
 * レート制限。true = 許可、false = 拒否。
 * `UPSTASH_REDIS_REST_*` 未設定時はプロセス内インメモリ（従来どおり）。
 */
export async function rateLimitAllowed(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const limiter = getUpstashLimiter(max, windowMs);
  if (!limiter) {
    return memoryRateLimitAllowed(key, max, windowMs);
  }

  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (err) {
    console.error("Upstash rate limit failed, falling back to memory:", err);
    return memoryRateLimitAllowed(key, max, windowMs);
  }
}
