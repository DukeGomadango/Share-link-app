"use client";

import { useEffect, useState } from "react";
import { BentoGrid, BentoItem } from "@/components/shared/BentoGrid";
import { Copy, Gift, MousePointerClick, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetch("/api/stats/overview")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch((e) => console.error("Mock API fetch error:", e));
  }, []);

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
        <BentoItem className="md:col-span-1 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
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

        <BentoItem className="md:col-span-1">
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

        <BentoItem className="md:col-span-1">
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

        <BentoItem className="md:col-span-2 md:row-span-2 min-h-[300px]">
          <h3 className="text-lg font-semibold mb-4 text-foreground/80">
            {t.dashboard.recentActivity}
          </h3>
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 space-y-4 pb-8">
            <Copy className="w-12 h-12 opacity-50" />
            <p>{t.dashboard.noRecentActivity}</p>
          </div>
        </BentoItem>

        <BentoItem className="md:col-span-1 min-h-[300px] flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-foreground/80">
            {t.dashboard.quickLinks}
          </h3>
          <div className="space-y-4 flex-1">
            <Button
              variant="outline"
              className="w-full justify-start h-12 glass hover:bg-emerald-500/10 hover:text-emerald-500 border-border/50"
            >
              {t.dashboard.generateLink}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12 glass hover:bg-emerald-500/10 hover:text-emerald-500 border-border/50"
            >
              {t.dashboard.viewAnalytics}
            </Button>
          </div>
        </BentoItem>
      </BentoGrid>
    </div>
  );
}
