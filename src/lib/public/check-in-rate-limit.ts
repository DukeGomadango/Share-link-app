import { rateLimitAllowed } from "@/lib/rate-limit/sliding-window";

export async function checkInRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  return rateLimitAllowed(key, max, windowMs);
}
