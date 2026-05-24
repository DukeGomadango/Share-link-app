"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LibraryFilters } from "@/components/features/library/LibraryFilters";
import { useTranslation } from "@/lib/i18n";
import type { ComponentProps } from "react";

type LibraryFiltersProps = ComponentProps<typeof LibraryFilters>;

type LibraryFiltersSheetProps = LibraryFiltersProps & {
  activeFilterCount: number;
};

export function LibraryFiltersSheet({ activeFilterCount, ...filters }: LibraryFiltersSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="touch"
        className="min-h-11 shrink-0 lg:hidden"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal className="mr-2 size-4" />
        {t.mobile.filter}
        {activeFilterCount > 0 ? (
          <span className="ml-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        ) : null}
      </Button>
      <Sheet isOpen={open} onClose={() => setOpen(false)}>
        <SheetHeader className="px-4 pt-8 pb-2">
          <SheetTitle>{t.mobile.filter}</SheetTitle>
        </SheetHeader>
        <SheetBody className="px-2 pb-10">
          <LibraryFilters {...filters} />
          <Button type="button" size="touch" className="mt-6 w-full" onClick={() => setOpen(false)}>
            OK
          </Button>
        </SheetBody>
      </Sheet>
    </>
  );
}
