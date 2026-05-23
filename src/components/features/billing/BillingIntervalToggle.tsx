"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { BillingInterval } from "./billing-pricing";

export function BillingIntervalToggle({
  interval,
  onChange,
}: {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="glass-panel-strong relative inline-grid grid-cols-2 rounded-full border border-white/30 dark:border-white/25 p-1 min-w-[280px] shadow-lg"
      role="tablist"
      aria-label={t.billing.intervalLabel}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full",
          "bg-background/90 backdrop-blur-md shadow-md border border-white/40 dark:border-white/10",
          "transition-all duration-300 ease-out",
          interval === "month" ? "left-1" : "left-[calc(50%+2px)]"
        )}
      />
      <button
        type="button"
        role="tab"
        aria-selected={interval === "month"}
        onClick={() => onChange("month")}
        className={cn(
          "relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors",
          interval === "month" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {t.billing.intervalMonth}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={interval === "year"}
        onClick={() => onChange("year")}
        className={cn(
          "relative z-10 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
          interval === "year" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {t.billing.intervalYear}
        <span
          className={cn(
            "rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 py-0.5 text-[9px] font-bold text-white",
            interval === "year" && "animate-pulse"
          )}
        >
          {t.billing.intervalYearBadge}
        </span>
      </button>
    </div>
  );
}
