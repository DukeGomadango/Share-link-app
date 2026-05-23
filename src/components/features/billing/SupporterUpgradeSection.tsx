"use client";

import { useState } from "react";
import { Check, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import { BillingGlassCard } from "./BillingGlassCard";
import { BillingIntervalToggle } from "./BillingIntervalToggle";
import {
  BILLING_PRICES,
  formatYen,
  monthlyFromYearly,
  type BillingInterval,
} from "./billing-pricing";

type SupporterUpgradeSectionProps = {
  pending: string | null;
  onSwitchToSupporter: (interval: BillingInterval) => void;
  onOpenPortal: () => void;
};

export function SupporterUpgradeSection({
  pending,
  onSwitchToSupporter,
  onOpenPortal,
}: SupporterUpgradeSectionProps) {
  const { t } = useTranslation();
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const amount =
    interval === "month"
      ? BILLING_PRICES.supporter.month
      : BILLING_PRICES.supporter.year;

  const periodLabel =
    interval === "month" ? t.billing.pricePerMonth : t.billing.pricePerYear;

  function handleConfirmUpgrade() {
    setConfirmOpen(false);
    onSwitchToSupporter(interval);
  }

  return (
    <>
      <BillingGlassCard tier="supporter" className="space-y-5">
        <div className="flex items-start gap-3">
          <Heart className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-lg">{t.billing.upgradeSupporterTitle}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {t.billing.upgradeSupporterLead}
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {t.billing.supporterPerks.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground">{t.billing.supporterSameFeaturesNote}</p>

        <div className="flex justify-center">
          <BillingIntervalToggle interval={interval} onChange={setInterval} />
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">
            {formatYen(amount)}
            <span className="text-sm font-normal text-muted-foreground ml-1">/ {periodLabel}</span>
          </p>
          {interval === "year" && (
            <p className="text-xs text-muted-foreground mt-1">
              {t.billing.priceEquivalent.replace(
                "{amount}",
                formatYen(monthlyFromYearly(BILLING_PRICES.supporter.year))
              )}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-2">{t.billing.upgradeProrationNote}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            size="lg"
            className={cn(
              "flex-1 rounded-full font-bold text-white border-0",
              "bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500",
              "shadow-md shadow-amber-500/25"
            )}
            disabled={pending !== null}
            onClick={() => setConfirmOpen(true)}
          >
            {t.billing.ctaUpgradeSupporter}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1 rounded-full bg-background/50 backdrop-blur-sm"
            disabled={pending !== null}
            onClick={onOpenPortal}
          >
            {pending === "portal" ? t.common.loading : t.billing.manageSubscription}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
          {t.billing.upgradeSupporterPortalHint}
        </p>
      </BillingGlassCard>

      <Dialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold pr-8">
            {t.billing.upgradeConfirmTitle}
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            {t.billing.upgradeConfirmLead}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-foreground">
            {t.billing.upgradeConfirmPrice
              .replace("{amount}", formatYen(amount))
              .replace("{period}", periodLabel)}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {t.billing.upgradeConfirmSameFeatures}
          </p>
          <ul className="space-y-1.5 text-muted-foreground">
            {t.billing.upgradeConfirmBullets.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{t.billing.upgradeProrationNote}</p>
        </div>

        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full"
            disabled={pending !== null}
            onClick={() => setConfirmOpen(false)}
          >
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            className={cn(
              "flex-1 rounded-full font-bold text-white border-0",
              "bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500"
            )}
            disabled={pending !== null}
            onClick={handleConfirmUpgrade}
          >
            {pending?.startsWith("switch-") ? t.common.loading : t.billing.upgradeConfirmCta}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
