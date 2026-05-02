"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import type { QuickFilter, ViewMode } from "@/components/features/campaigns/types";
import { useTranslation } from "@/lib/i18n";

interface CampaignsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  activeFilter: QuickFilter;
  onFilterChange: (filter: QuickFilter) => void;
  quickFilters: QuickFilter[];
}

export function CampaignsFilters({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  activeFilter,
  onFilterChange,
  quickFilters,
}: CampaignsFiltersProps) {
  const { t } = useTranslation();

  return (
    <GlassCard className="p-4 md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-2 lg:max-w-xl">
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t.campaigns.searchPlaceholder}
            className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          />
          <div className="inline-flex w-fit rounded-lg border border-border bg-background/40 p-1">
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
              onClick={() => onViewModeChange("list")}
              className={viewMode === "list" ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""}
            >
              {t.campaigns.views.list}
            </Button>
            <Button
              size="sm"
              variant={viewMode === "kanban" ? "default" : "ghost"}
              onClick={() => onViewModeChange("kanban")}
              className={viewMode === "kanban" ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""}
            >
              {t.campaigns.views.kanban}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filterKey) => (
            <Button
              key={filterKey}
              variant={activeFilter === filterKey ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filterKey)}
              className={
                activeFilter === filterKey
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : ""
              }
            >
              {t.campaigns.quickFilters[filterKey]}
            </Button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t.campaigns.keyboardHint}</p>
    </GlassCard>
  );
}
