export type PlanTier = "free" | "pro";

/** Free: 2GB / 90日。Pro: 50GB / 自動削除なし（expires_at = null） */
export const PLAN_LIMITS = {
  free: {
    storageBytes: 2_147_483_648,
    retentionDays: 90,
  },
  pro: {
    storageBytes: 53_687_091_200, // 50 GiB
    retentionDays: null as null,
  },
} as const satisfies Record<
  PlanTier,
  { storageBytes: number; retentionDays: number | null }
>;

export function normalizePlanTier(value: string | null | undefined): PlanTier {
  return value === "pro" ? "pro" : "free";
}

/** プランに応じた容量上限（DB の storage_limit は Pro 手動昇格時の上書き用に参照） */
export function effectiveStorageLimitBytes(
  planTier: PlanTier,
  storageLimitInDb: number | null | undefined
): number {
  const tierCap = PLAN_LIMITS[planTier].storageBytes;
  const fromDb = storageLimitInDb ?? tierCap;
  if (planTier === "pro") {
    return Math.max(fromDb, tierCap);
  }
  return Math.min(fromDb, tierCap);
}

/** 新規アセットの expires_at。Pro は null（purge 対象外） */
export function computeAssetExpiresAt(planTier: PlanTier, now = new Date()): Date | null {
  const days = PLAN_LIMITS[planTier].retentionDays;
  if (days == null) {
    return null;
  }
  const expires = new Date(now);
  expires.setDate(expires.getDate() + days);
  return expires;
}
