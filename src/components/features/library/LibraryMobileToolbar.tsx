"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LibraryFiltersSheet } from "@/components/features/library/LibraryFiltersSheet";
import type { ComponentProps } from "react";

type LibraryFiltersSheetProps = ComponentProps<typeof LibraryFiltersSheet>;

export function LibraryMobileToolbar(props: LibraryFiltersSheetProps) {
  const {
    searchQuery,
    onSearchQueryChange,
    labels,
    activeFilterCount,
    ...sheetProps
  } = props;

  return (
    <div className="flex flex-col gap-3 lg:hidden">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="min-h-11 rounded-xl border-border/50 bg-background/50 pl-10"
          />
        </div>
        <LibraryFiltersSheet
          activeFilterCount={activeFilterCount}
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          labels={labels}
          {...sheetProps}
        />
      </div>
    </div>
  );
}
