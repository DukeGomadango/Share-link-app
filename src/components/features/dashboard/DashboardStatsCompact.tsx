"use client";

import type { DashboardOverviewStats } from "@/lib/stats/overview";
import { useTranslation } from "@/lib/i18n";

type DashboardStatsCompactProps = {
  stats: DashboardOverviewStats | null;
  loading: boolean;
};

export function DashboardStatsCompact({ stats, loading }: DashboardStatsCompactProps) {
  const { t } = useTranslation();

  if (loading || !stats) {
    return (
      <p className="text-sm text-muted-foreground md:hidden">{t.common.loading}</p>
    );
  }

  return (
    <p className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground md:hidden">
      {t.dashboard.activeCampaigns}: <strong className="text-foreground">{stats.activeCampaigns}</strong>
      {" · "}
      {t.dashboard.openRate}: <strong className="text-foreground">{stats.openRate}%</strong>
      {stats.unassignedAssets > 0 ? (
        <>
          {" · "}
          <span className="text-amber-600">
            {t.dashboard.unassignedAssetsHint.replace("{count}", String(stats.unassignedAssets))}
          </span>
        </>
      ) : null}
    </p>
  );
}
