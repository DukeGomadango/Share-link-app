"use client";

import { Check, Lock, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import {
  BILLING_PRICES,
  formatYen,
  monthlyFromYearly,
  type BillingInterval,
} from "./billing-pricing";

export function PriceDisplay({
  amount,
  interval,
  accent = "default",
  freeSubtext,
}: {
  amount: number;
  interval: BillingInterval;
  accent?: "default" | "pro" | "supporter";
  freeSubtext?: string;
}) {
  const { t } = useTranslation();
  const period =
    interval === "month" ? t.billing.pricePerMonth : t.billing.pricePerYear;

  if (amount === 0) {
    return (
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-medium text-muted-foreground">¥</span>
          <span className="text-5xl font-bold tracking-tight text-foreground/80">0</span>
        </div>
        {freeSubtext && (
          <p className="text-xs text-muted-foreground mt-1">{freeSubtext}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-medium text-muted-foreground self-start mt-2">
          ¥
        </span>
        <span
          className={cn(
            "text-5xl font-bold tracking-tight tabular-nums",
            accent === "pro" && "text-emerald-700 dark:text-emerald-300",
            accent === "supporter" && "text-amber-700 dark:text-amber-300"
          )}
        >
          {amount.toLocaleString("ja-JP")}
        </span>
        <span className="text-sm text-muted-foreground pb-2 ml-1">/ {period}</span>
      </div>
      {interval === "year" && amount === BILLING_PRICES.pro.year && (
        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1">
          {t.billing.priceEquivalent.replace(
            "{amount}",
            formatYen(monthlyFromYearly(BILLING_PRICES.pro.year))
          )}
        </p>
      )}
      {interval === "year" && amount === BILLING_PRICES.supporter.year && (
        <p className="text-xs text-amber-800/80 dark:text-amber-300/90 font-medium mt-1">
          {t.billing.priceEquivalent.replace(
            "{amount}",
            formatYen(monthlyFromYearly(BILLING_PRICES.supporter.year))
          )}
        </p>
      )}
    </div>
  );
}

export type PlanFeature = {
  text: string;
  locked?: boolean;
};

export function PlanFeatureList({
  items,
  accent,
}: {
  items: PlanFeature[];
  accent: "muted" | "pro" | "supporter";
}) {
  return (
    <ul className="flex-1 space-y-2.5 text-sm min-h-0">
      {items.map((item) => (
        <li key={item.text} className="flex gap-2.5 items-start">
          <FeatureIcon locked={item.locked} accent={accent} />
          <span
            className={cn(
              "leading-snug",
              item.locked
                ? "text-muted-foreground/50 line-through decoration-muted-foreground/40"
                : "text-muted-foreground"
            )}
          >
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function FeatureIcon({
  locked,
  accent,
}: {
  locked?: boolean;
  accent: "muted" | "pro" | "supporter";
}) {
  if (locked) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/40">
        <X className="h-3 w-3 text-muted-foreground/50" />
      </span>
    );
  }

  const ring =
    accent === "pro"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : accent === "supporter"
        ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
        : "bg-muted/50 text-muted-foreground";

  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
        ring
      )}
    >
      <Check className="h-3 w-3 stroke-[2.5]" />
    </span>
  );
}

export function BillingTrustFooter({
  variant = "checkout",
}: {
  variant?: "checkout" | "marketing";
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="glass-panel-strong inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
          <Lock className="h-3.5 w-3.5" />
          {t.billing.trustStripe}
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
          Powered by Stripe
        </span>
      </div>
      <p className="text-xs text-muted-foreground text-center leading-relaxed glass-text-safe">
        {variant === "marketing" ? t.billing.marketingPricingNote : t.billing.checkoutFootnote}
      </p>
      {variant === "checkout" && (
        <div className="glass-panel-strong flex items-start gap-2 rounded-2xl border border-emerald-500/25 px-4 py-3 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <p>{t.billing.trustCancel}</p>
        </div>
      )}
    </div>
  );
}
