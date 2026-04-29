"use client";

import { useEffect, useState } from "react";
import { BentoGrid, BentoItem } from "@/components/shared/BentoGrid";
import {
  AlertTriangle,
  ArrowRight,
  Gift,
  MousePointerClick,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import type { DashboardOverviewStats } from "@/lib/stats/overview";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardOverviewStats | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetch("/api/stats/overview")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch((e) => console.error("Mock API fetch error:", e));
  }, []);

  const weeklyViews = stats?.weeklyViews ?? null;
  const hasLowOpenRate = stats?.anomalies.lowOpenRate ?? false;
  const hasNoActiveCampaign = stats?.anomalies.noActiveCampaigns ?? false;
  const anomalyCount = Number(hasLowOpenRate) + Number(hasNoActiveCampaign);
  const anomalyToneClass =
    anomalyCount > 0
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-emerald-500/10 border-emerald-500/20";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
          <Gift className="w-4 h-4 mr-2" />
          {t.dashboard.newCampaign}
        </Button>
      </div>

      <BentoGrid>
        <BentoItem colSpan={2} className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.todayFocus}</p>
              <h2 className="text-2xl font-bold mt-1">{t.dashboard.nextBestActionsTitle}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t.dashboard.nextBestActionsDescription}</p>
              {stats && (
                <p className="text-xs mt-2 text-muted-foreground">
                  {t.dashboard.unassignedAssetsHint.replace("{count}", String(stats.unassignedAssets))}
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-500/20 rounded-full shrink-0">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Button asChild className="justify-between">
              <Link href="/campaigns/new">
                {t.dashboard.actionCreateCampaign}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link href="/library">
                {t.dashboard.actionAssignUnassigned}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </BentoItem>

        <BentoItem colSpan={1} className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-full">
              <Gift className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.activeCampaigns}</p>
              <h2 className="text-3xl font-bold">{stats?.activeCampaigns ?? "-"}</h2>
            </div>
          </div>
        </BentoItem>

        <BentoItem colSpan={1}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.totalDistributed}</p>
              <h2 className="text-3xl font-bold">{stats?.totalDistributed ?? "-"}</h2>
            </div>
          </div>
        </BentoItem>

        <BentoItem colSpan={1} className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-full">
              <MousePointerClick className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.openRate}</p>
              <h2 className="text-3xl font-bold">
                {stats ? `${stats.openRate}%` : "-"}
              </h2>
            </div>
          </div>
        </BentoItem>

        <BentoItem colSpan={2} className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.roiProof}</p>
              <h3 className="text-lg font-semibold mt-1">{t.dashboard.roiHeadline}</h3>
              <p className="text-sm mt-2 text-muted-foreground">
                {stats
                  ? t.dashboard.roiMessage
                      .replace("{count}", String(weeklyViews ?? 0))
                      .replace("{openRate}", String(stats.openRate))
                  : t.common.loading}
              </p>
              {stats && (
                <p className="text-xs mt-2 text-emerald-500">
                  {t.dashboard.weeklyGrowth.replace("{value}", String(stats.weekOverWeekGrowth))}
                </p>
              )}
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-full shrink-0">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4">
            <Button asChild variant="outline" className="justify-between">
              <Link href="/campaigns">
                {t.dashboard.viewTopCampaigns}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </BentoItem>

        <BentoItem colSpan={1} className={anomalyToneClass}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.anomalyWatch}</p>
              <h3 className="text-lg font-semibold mt-1">
                {anomalyCount > 0 ? t.dashboard.needsAttention : t.dashboard.healthyStatus}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <p className="text-sm mt-3 text-muted-foreground">
            {hasLowOpenRate
              ? t.dashboard.lowOpenRateMessage.replace("{openRate}", String(stats?.openRate ?? 0))
              : t.dashboard.noAnomalyMessage}
          </p>
          <div className="mt-4 space-y-2">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/campaigns">
                {hasLowOpenRate ? t.dashboard.actionReviewCampaigns : t.dashboard.actionOpenCampaigns}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            {hasNoActiveCampaign && (
              <Button asChild className="w-full justify-between">
                <Link href="/campaigns/new">
                  {t.dashboard.actionLaunchFirstCampaign}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </BentoItem>
      </BentoGrid>
    </div>
  );
}
