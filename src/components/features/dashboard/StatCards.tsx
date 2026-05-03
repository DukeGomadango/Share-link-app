"use client";

import { BentoItem } from "@/components/shared/BentoGrid";
import { Gift, Users, MousePointerClick } from "lucide-react";

interface StatCardsProps {
  stats: {
    activeCampaigns: number;
    totalDistributed: number;
    openRate: number;
  } | null;
  loading: boolean;
  t: any;
}

function StatSkeleton({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block h-9 min-w-[3ch] rounded-md bg-muted animate-pulse ${className ?? ""}`}
      aria-hidden
    />
  );
}

export function StatCards({ stats, loading, t }: StatCardsProps) {
  return (
    <>
      <BentoItem colSpan={1} className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/20 rounded-full">
            <Gift className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t.dashboard.activeCampaigns}</p>
            <h2 className="text-3xl font-bold">
              {loading ? <StatSkeleton /> : stats?.activeCampaigns ?? "-"}
            </h2>
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
            <h2 className="text-3xl font-bold">
              {loading ? <StatSkeleton /> : stats?.totalDistributed ?? "-"}
            </h2>
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
              {loading ? <StatSkeleton /> : stats ? `${stats.openRate}%` : "-"}
            </h2>
          </div>
        </div>
      </BentoItem>
    </>
  );
}
