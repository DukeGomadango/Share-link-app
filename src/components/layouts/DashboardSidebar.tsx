"use client";

import { usePathname } from "next/navigation";
import { Gift } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { useTranslation } from "@/lib/i18n";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { PlanStatusWidget } from "@/components/shared/PlanStatusWidget";
import { useWorkspaceStats } from "@/hooks/features/workspace/useWorkspaceStats";
import { DASHBOARD_SIDEBAR_NAV } from "@/lib/dashboard-nav";
import { DashboardNavLink } from "@/components/layouts/DashboardNavLink";

export function DashboardSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { stats } = useWorkspaceStats();

  return (
    <aside className="hidden h-full w-64 flex-col rounded-l-none border-r-0 glass lg:flex">
      <div className="flex items-center space-x-2 p-6">
        <Gift className="h-6 w-6 text-emerald-500" aria-hidden />
        <span className="text-lg font-bold tracking-tight">{t.app.brandName}</span>
      </div>

      <nav className="mt-4 flex-1 space-y-2 px-4" aria-label={t.nav.mobileNavLabel}>
        {DASHBOARD_SIDEBAR_NAV.map((item) => (
          <DashboardNavLink
            key={item.id}
            item={item}
            label={t.nav[item.labelKey]}
            active={item.isActive(pathname)}
            variant="sidebar"
          />
        ))}
      </nav>

      <div className="mb-4 px-4">
        <PlanStatusWidget
          planTier={stats?.planTier === "pro" ? "pro" : "free"}
          billingTier={stats?.billingTier ?? null}
          usedBytes={stats?.usedBytes || 0}
          limitBytes={stats?.limitBytes || 2147483648}
        />
      </div>

      <div className="space-y-2 border-t border-border p-4">
        <SignOutButton label={t.settings.account.signOut} className="w-full min-h-11" variant="ghost" />
        <LanguageToggle className="w-full min-h-11 justify-center" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t.nav.version}</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
