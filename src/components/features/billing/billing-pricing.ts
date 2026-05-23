export type BillingInterval = "month" | "year";
export type CheckoutTier = "pro" | "supporter";
export type BillingLayout = "detailed" | "columns";

export const BILLING_PRICES = {
  pro: { month: 980, year: 9_800 },
  supporter: { month: 1_980, year: 19_800 },
} as const;

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

export function monthlyFromYearly(yearly: number): number {
  return Math.round(yearly / 12);
}

export function checkoutPendingKey(tier: CheckoutTier, interval: BillingInterval): string {
  return `${tier}-${interval}`;
}
