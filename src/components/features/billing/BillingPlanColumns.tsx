"use client";

import { Crown, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import {
  BillingGlassCard,
  type BillingPlanTier,
} from "./BillingGlassCard";
import {
  BillingTrustFooter,
  PlanFeatureList,
  PriceDisplay,
  type PlanFeature,
} from "./BillingPricingParts";
import {
  BILLING_PRICES,
  checkoutPendingKey,
  type BillingInterval,
  type CheckoutTier,
} from "./billing-pricing";

const PRO_ACCENT = "linear-gradient(90deg, oklch(0.645 0.165 158.452), oklch(0.6 0.12 200))";
const SUPPORTER_ACCENT =
  "linear-gradient(90deg, oklch(0.75 0.14 75), oklch(0.65 0.12 45))";

/** 3カラムでバッジ行の高さを揃え、カード上端・下端を一致させる */
const BADGE_SLOT_CLASS =
  "mb-3 flex h-7 shrink-0 items-center justify-center";

const PLAN_FOOTER_CLASS =
  "mt-auto flex min-h-[5.75rem] flex-col justify-end gap-3 pt-2";

type BillingPlanColumnsProps = {
  interval: BillingInterval;
  pending: string | null;
  onCheckout: (tier: CheckoutTier, interval: BillingInterval) => void;
};

export function BillingPlanColumns({
  interval,
  pending,
  onCheckout,
}: BillingPlanColumnsProps) {
  const { t } = useTranslation();

  const freeFeatures: PlanFeature[] = [
    { text: t.billing.freeStorage },
    { text: t.billing.freeRetention },
    { text: t.billing.freeIntegration },
    { text: t.billing.freeLockedStorage, locked: true },
    { text: t.billing.freeLockedNoExpiry, locked: true },
  ];

  const proFeatures: PlanFeature[] = t.billing.proHighlights.map((text) => ({
    text,
  }));

  const supporterFeatures: PlanFeature[] = t.billing.supporterPerks.map((text) => ({
    text,
  }));

  const recommendedBadge = (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md shadow-emerald-500/30">
      <Sparkles className="w-3 h-3" />
      {t.billing.recommended}
    </span>
  );

  return (
    <div className="space-y-8 overflow-visible">
      <div className="grid grid-cols-1 gap-5 overflow-visible lg:grid-cols-3 lg:items-stretch lg:gap-5">
        <FreeColumn features={freeFeatures} />

        <ProColumn
          interval={interval}
          features={proFeatures}
          pending={pending}
          onCheckout={onCheckout}
          badge={recommendedBadge}
        />

        <SupporterColumn
          interval={interval}
          features={supporterFeatures}
          pending={pending}
          onCheckout={onCheckout}
        />
      </div>

      <BillingTrustFooter />
    </div>
  );
}

function PlanColumnShell({
  badge,
  tier,
  accentLine,
  cardClassName,
  children,
}: {
  badge?: React.ReactNode;
  tier: BillingPlanTier;
  accentLine?: string;
  cardClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={BADGE_SLOT_CLASS}>
        {badge ?? <span className="inline-block h-6 w-[7.25rem] shrink-0" aria-hidden />}
      </div>
      <BillingGlassCard
        tier={tier}
        accentLine={accentLine}
        className={cn("flex min-h-0 flex-1 flex-col", cardClassName)}
      >
        {children}
      </BillingGlassCard>
    </div>
  );
}

function FreeColumn({ features }: { features: PlanFeature[] }) {
  const { t } = useTranslation();

  return (
    <PlanColumnShell tier="free">
      <div className="flex min-h-0 flex-1 flex-col space-y-4">
        <PlanColumnHeader
          title={t.billing.rowFree}
          subtitle={t.billing.freeColumnTagline}
          titleClassName="text-foreground/80"
        />
        <PriceDisplay amount={0} interval="month" freeSubtext={t.billing.freePriceSubtext} />
        <PlanFeatureList items={features} accent="muted" />
        <div className={PLAN_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled
            className="w-full rounded-full border border-dashed border-border bg-background/50 backdrop-blur-sm text-muted-foreground font-medium cursor-default dark:border-white/20"
          >
            {t.billing.freeCurrentPlan}
          </Button>
        </div>
      </div>
    </PlanColumnShell>
  );
}

function ProColumn({
  interval,
  features,
  pending,
  onCheckout,
  badge,
}: {
  interval: BillingInterval;
  features: PlanFeature[];
  pending: string | null;
  onCheckout: (tier: CheckoutTier, interval: BillingInterval) => void;
  badge: React.ReactNode;
}) {
  const { t } = useTranslation();
  const amount =
    interval === "month" ? BILLING_PRICES.pro.month : BILLING_PRICES.pro.year;

  return (
    <PlanColumnShell
      badge={badge}
      tier="pro"
      accentLine={PRO_ACCENT}
      cardClassName="ring-2 ring-emerald-500/35 shadow-lg shadow-emerald-500/15 lg:z-[1]"
    >
      <div className="flex min-h-0 flex-1 flex-col space-y-4">
        <PlanColumnHeader
          title={t.billing.proTitle}
          subtitle={t.billing.proTagline}
          icon={
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/30">
              <Crown className="w-4 h-4" />
            </div>
          }
          titleClassName="text-xl"
        />
        <PriceDisplay amount={amount} interval={interval} accent="pro" />
        <PlanFeatureList items={features} accent="pro" />
        <div className={PLAN_FOOTER_CLASS}>
          <Button
            type="button"
            size="lg"
            className={cn(
              "w-full rounded-full font-bold text-white border-0",
              "bg-gradient-to-r from-emerald-500 to-teal-600",
              "shadow-lg shadow-emerald-500/30",
              "transition-all duration-200",
              "hover:from-emerald-400 hover:to-teal-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/35"
            )}
            disabled={pending !== null}
            onClick={() => onCheckout("pro", interval)}
          >
            {pending === checkoutPendingKey("pro", interval)
              ? t.common.loading
              : t.billing.ctaPro}
          </Button>
        </div>
      </div>
    </PlanColumnShell>
  );
}

function SupporterColumn({
  interval,
  features,
  pending,
  onCheckout,
}: {
  interval: BillingInterval;
  features: PlanFeature[];
  pending: string | null;
  onCheckout: (tier: CheckoutTier, interval: BillingInterval) => void;
}) {
  const { t } = useTranslation();
  const amount =
    interval === "month"
      ? BILLING_PRICES.supporter.month
      : BILLING_PRICES.supporter.year;

  return (
    <PlanColumnShell tier="supporter" accentLine={SUPPORTER_ACCENT}>
      <div className="flex min-h-0 flex-1 flex-col space-y-4">
        <PlanColumnHeader
          title={t.billing.supporterTitle}
          subtitle={t.billing.supporterColumnTagline}
          icon={
            <Heart className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          }
        />
        <PriceDisplay amount={amount} interval={interval} accent="supporter" />
        <PlanFeatureList items={features} accent="supporter" />
        <div className={PLAN_FOOTER_CLASS}>
          <p className="text-[10px] text-muted-foreground leading-relaxed min-h-[2.5rem]">
            {t.billing.supporterSameFeaturesNote}
          </p>
          <Button
            type="button"
            size="lg"
            className={cn(
              "w-full rounded-full font-bold text-white border-0",
              "bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500",
              "shadow-md shadow-amber-500/25",
              "transition-all duration-200",
              "hover:from-amber-400 hover:via-amber-500 hover:to-orange-400",
              "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30"
            )}
            disabled={pending !== null}
            onClick={() => onCheckout("supporter", interval)}
          >
            {pending === checkoutPendingKey("supporter", interval)
              ? t.common.loading
              : t.billing.ctaSupporter}
          </Button>
        </div>
      </div>
    </PlanColumnShell>
  );
}

function PlanColumnHeader({
  title,
  subtitle,
  icon,
  titleClassName,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  titleClassName?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className={cn("font-bold text-lg", titleClassName)}>{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{subtitle}</p>
    </div>
  );
}
