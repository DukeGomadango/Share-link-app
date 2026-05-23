"use client";

import { useState } from "react";
import { Check, Heart, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { BillingGlassCard, BillingGlassScene } from "./BillingGlassCard";
import { BillingIntervalToggle } from "./BillingIntervalToggle";
import { BillingPlanColumns } from "./BillingPlanColumns";
import { SupporterUpgradeSection } from "./SupporterUpgradeSection";
import type { BillingInterval, CheckoutTier } from "./billing-pricing";

export type { BillingInterval, CheckoutTier } from "./billing-pricing";

type BillingPlanPickerProps = {
  isPro: boolean;
  isSupporter: boolean;
  hasCustomer: boolean;
  subscriptionCurrentPeriodEnd: string | null;
  pending: string | null;
  onCheckout: (tier: CheckoutTier, interval: BillingInterval) => void;
  onOpenPortal: () => void;
  onSwitchToSupporter: (interval: BillingInterval) => void;
};

export function BillingPlanPicker({
  isPro,
  isSupporter,
  hasCustomer,
  subscriptionCurrentPeriodEnd,
  pending,
  onCheckout,
  onOpenPortal,
  onSwitchToSupporter,
}: BillingPlanPickerProps) {
  const { t } = useTranslation();
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <div className="space-y-8">
      <BillingGlassCard tier="neutral" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t.billing.currentPlan}
          </p>
          <p className="text-lg font-semibold mt-1">
            {isPro
              ? isSupporter
                ? t.billing.statusSupporter
                : t.billing.statusPro
              : t.billing.statusFree}
          </p>
          {subscriptionCurrentPeriodEnd && isPro && (
            <p className="text-xs text-muted-foreground mt-2">
              {t.billing.periodEnd}:{" "}
              {new Date(subscriptionCurrentPeriodEnd).toLocaleDateString("ja-JP")}
            </p>
          )}
        </div>
        {isPro && hasCustomer && (
          <Button
            type="button"
            variant="outline"
            className="shrink-0 rounded-full bg-background/50 backdrop-blur-sm"
            disabled={pending !== null}
            onClick={onOpenPortal}
          >
            {pending === "portal" ? t.common.loading : t.billing.manageSubscription}
          </Button>
        )}
      </BillingGlassCard>

      {isPro && !isSupporter && (
        <SupporterUpgradeSection
          pending={pending}
          onSwitchToSupporter={onSwitchToSupporter}
          onOpenPortal={onOpenPortal}
        />
      )}

      {isPro && isSupporter && (
        <BillingGlassCard tier="supporter" className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="font-semibold">{t.billing.supporterPerksTitle}</h2>
          </div>
          <ul className="space-y-2">
            {t.billing.supporterPerks.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </BillingGlassCard>
      )}

      {isPro && (
        <BillingGlassCard tier="neutral" className="flex gap-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="space-y-2 leading-relaxed">
            <p>{t.billing.proUserEmailHelp}</p>
            <p>{t.billing.proUserPortalHelp}</p>
          </div>
        </BillingGlassCard>
      )}

      {!isPro && (
        <BillingGlassScene className="space-y-6">
          <div className="flex justify-center pt-1">
            <BillingIntervalToggle interval={interval} onChange={setInterval} />
          </div>
          <BillingPlanColumns
            interval={interval}
            pending={pending}
            onCheckout={onCheckout}
          />
        </BillingGlassScene>
      )}
    </div>
  );
}
