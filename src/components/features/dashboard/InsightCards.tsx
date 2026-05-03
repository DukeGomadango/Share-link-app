"use client";

import { BentoItem } from "@/components/shared/BentoGrid";
import { TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface InsightCardsProps {
  stats: {
    weeklyViews: number | null;
    openRate: number;
    weekOverWeekGrowth: number;
    anomalies: {
      lowOpenRate: boolean;
      noActiveCampaigns: boolean;
    };
  } | null;
  t: any;
}

export function InsightCards({ stats, t }: InsightCardsProps) {
  const weeklyViews = stats?.weeklyViews ?? null;
  const hasLowOpenRate = stats?.anomalies.lowOpenRate ?? false;
  const hasNoActiveCampaign = stats?.anomalies.noActiveCampaigns ?? false;
  const anomalyCount = Number(hasLowOpenRate) + Number(hasNoActiveCampaign);
  const anomalyToneClass =
    anomalyCount > 0
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-emerald-500/10 border-emerald-500/20";

  return (
    <>
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
    </>
  );
}
