"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CampaignsFilterSheet } from "@/components/features/campaigns/CampaignsFilterSheet";
import { CampaignQuickFilterChips } from "@/components/features/campaigns/CampaignQuickFilterChips";
import type { ComponentProps } from "react";
import type { QuickFilter } from "@/components/features/campaigns/types";
import { useTranslation } from "@/lib/i18n";

type CampaignsFilterSheetProps = ComponentProps<typeof CampaignsFilterSheet>;

type CampaignsMobileToolbarProps = CampaignsFilterSheetProps & {
  quickFilters: QuickFilter[];
  activeFilter: QuickFilter;
  onFilterChange: (filter: QuickFilter) => void;
};

export function CampaignsMobileToolbar({
  quickFilters,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  ...sheetProps
}: CampaignsMobileToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 lg:hidden">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.campaigns.searchPlaceholder}
            className="min-h-11 rounded-xl border-border/50 bg-background/50 pl-10"
          />
        </div>
        <CampaignsFilterSheet
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          quickFilters={quickFilters}
          {...sheetProps}
        />
      </div>
      <CampaignQuickFilterChips
        filters={quickFilters}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
    </div>
  );
}
