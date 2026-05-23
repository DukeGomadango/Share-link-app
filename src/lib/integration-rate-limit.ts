import { rateLimitAllowed } from "@/lib/rate-limit/sliding-window";

/** 既定: 1分あたり 120 リクエスト / トークン */
export const INTEGRATION_RATE_MAX = 120;
export const INTEGRATION_RATE_WINDOW_MS = 60_000;

export async function integrationRateLimit(
  integrationTokenId: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  return rateLimitAllowed(`integration:${integrationTokenId}`, max, windowMs);
}
