export type BillingProductTier = "pro" | "supporter";
export type BillingInterval = "month" | "year";

const PRICE_ENV_KEYS: Record<BillingProductTier, Record<BillingInterval, string>> = {
  pro: {
    month: "STRIPE_PRICE_PRO_MONTHLY",
    year: "STRIPE_PRICE_PRO_YEARLY",
  },
  supporter: {
    month: "STRIPE_PRICE_SUPPORTER_MONTHLY",
    year: "STRIPE_PRICE_SUPPORTER_YEARLY",
  },
};

export function getStripePriceId(
  tier: BillingProductTier,
  interval: BillingInterval
): string | null {
  const envKey = PRICE_ENV_KEYS[tier][interval];
  const value = process.env[envKey]?.trim();
  return value || null;
}

export function resolveBillingTierFromPriceId(
  priceId: string | null | undefined
): BillingProductTier | null {
  if (!priceId) {
    return null;
  }
  for (const tier of ["pro", "supporter"] as const) {
    for (const interval of ["month", "year"] as const) {
      if (getStripePriceId(tier, interval) === priceId) {
        return tier;
      }
    }
  }
  return null;
}

export function areStripePricesConfigured(): boolean {
  return (
    Boolean(getStripePriceId("pro", "month")) &&
    Boolean(getStripePriceId("pro", "year")) &&
    Boolean(getStripePriceId("supporter", "month")) &&
    Boolean(getStripePriceId("supporter", "year"))
  );
}
