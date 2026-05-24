"use client";

import { usePathname } from "next/navigation";
import { Gift } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { DASHBOARD_SIDEBAR_NAV } from "@/lib/dashboard-nav";
import { DashboardNavLink } from "@/components/layouts/DashboardNavLink";
import { Sheet, SheetBody, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { PlanStatusWidget } from "@/components/shared/PlanStatusWidget";
import { useWorkspaceStats } from "@/hooks/features/workspace/useWorkspaceStats";

type DashboardMobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function DashboardMobileMenu({ open, onClose }: DashboardMobileMenuProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { stats } = useWorkspaceStats();

  return (
    <Sheet isOpen={open} onClose={onClose}>
      <SheetHeader className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 pr-10">
          <Gift className="size-6 text-emerald-500" aria-hidden />
          <SheetTitle>{t.nav.menu}</SheetTitle>
        </div>
      </SheetHeader>
      <SheetBody className="space-y-6 px-4 pb-8">
        <nav className="flex flex-col gap-1" aria-label={t.nav.mobileNavLabel}>
          {DASHBOARD_SIDEBAR_NAV.map((item) => (
            <DashboardNavLink
              key={item.id}
              item={item}
              label={t.nav[item.labelKey]}
              active={item.isActive(pathname)}
              variant="menu"
              onNavigate={onClose}
            />
          ))}
        </nav>

        <PlanStatusWidget
          planTier={stats?.planTier === "pro" ? "pro" : "free"}
          billingTier={stats?.billingTier ?? null}
          usedBytes={stats?.usedBytes || 0}
          limitBytes={stats?.limitBytes || 2147483648}
        />

        <div className="space-y-3 border-t border-border/40 pt-4">
          <SignOutButton
            label={t.settings.account.signOut}
            className="w-full min-h-11"
            variant="ghost"
          />
          <LanguageToggle className="w-full min-h-11 justify-center" />
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">{t.nav.version}</span>
            <ThemeToggle />
          </div>
        </div>
      </SheetBody>
    </Sheet>
  );
}
