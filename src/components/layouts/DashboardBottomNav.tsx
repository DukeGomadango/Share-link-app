"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { DASHBOARD_BOTTOM_NAV } from "@/lib/dashboard-nav";
import { DashboardNavLink } from "@/components/layouts/DashboardNavLink";

export function DashboardBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-md pb-safe lg:hidden"
      aria-label={t.nav.mobileNavLabel}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {DASHBOARD_BOTTOM_NAV.map((item) => (
          <DashboardNavLink
            key={item.id}
            item={item}
            label={t.nav[item.labelKey]}
            active={item.isActive(pathname)}
            variant="bottom"
          />
        ))}
      </div>
    </nav>
  );
}
