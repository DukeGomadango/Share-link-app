"use client";

import Link from "next/link";
import { Gift, Menu } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type DashboardMobileHeaderProps = {
  onOpenMenu: () => void;
};

export function DashboardMobileHeader({ onOpenMenu }: DashboardMobileHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex lg:hidden h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 backdrop-blur-md pt-safe">
      <Link
        href="/dashboard"
        className="flex min-h-11 min-w-11 items-center gap-2 rounded-lg pr-2 font-semibold tracking-tight"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Gift className="size-4" aria-hidden />
        </span>
        <span className="truncate text-sm">{t.app.brandName}</span>
      </Link>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 shrink-0 rounded-xl"
        onClick={onOpenMenu}
        aria-label={t.nav.menu}
        aria-haspopup="dialog"
      >
        <Menu className="size-5" aria-hidden />
      </Button>
    </header>
  );
}
