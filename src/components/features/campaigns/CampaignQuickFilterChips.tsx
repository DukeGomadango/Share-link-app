"use client";

import { cn } from "@/lib/utils";
import type { QuickFilter } from "@/components/features/campaigns/types";
import { useTranslation } from "@/lib/i18n";

const MOBILE_CHIP_FILTERS: QuickFilter[] = [
  "all",
  "needsAttention",
  "active",
  "draft",
];

type CampaignQuickFilterChipsProps = {
  filters: QuickFilter[];
  activeFilter: QuickFilter;
  onFilterChange: (filter: QuickFilter) => void;
};

export function CampaignQuickFilterChips({
  filters: _filters,
  activeFilter,
  onFilterChange,
}: CampaignQuickFilterChipsProps) {
  const { t } = useTranslation();
  const chips = MOBILE_CHIP_FILTERS;
  const activeInChips = chips.includes(activeFilter);

  return (
    <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
      {chips.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onFilterChange(key)}
          className={cn(
            "min-h-10 shrink-0 rounded-full border px-3 text-xs font-semibold",
            activeFilter === key
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-border/60 bg-background text-muted-foreground"
          )}
        >
          {t.campaigns.quickFilters[key]}
        </button>
      ))}
      {!activeInChips && activeFilter !== "all" ? (
        <span className="flex min-h-10 shrink-0 items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          {t.campaigns.quickFilters[activeFilter]}
        </span>
      ) : null}
      <span className="flex min-h-10 shrink-0 items-center px-1 text-[10px] text-muted-foreground">
        {t.mobile.moreFiltersInSheet}
      </span>
    </div>
  );
}
