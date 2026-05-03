"use client";

import { cn } from "@/lib/utils";
import { 
  Clock, 
  Shield, 
  CheckCircle2, 
  TrendingUp, 
  ChevronRight 
} from "lucide-react";
import type { RecipientFilter } from "@/components/features/campaigns/types";

interface RecipientStatsCardsProps {
  stats: {
    waiting: number;
    verified: number;
    claimed: number;
    trends: {
      waiting: { value: string; isUp: boolean };
      verified: { value: string; isUp: boolean };
      claimed: { value: string; isRate: boolean };
    };
    total: number;
    breakdown: {
      waitingRate: number;
      verifiedRate: number;
      claimedRate: number;
    };
  };
  activeFilter: RecipientFilter;
  setActiveFilter: (filter: RecipientFilter) => void;
}

export function RecipientStatsCards({ stats, activeFilter, setActiveFilter }: RecipientStatsCardsProps) {
  const items = [
    { 
      id: "waiting", 
      label: "待機中 (Waiting)", 
      count: stats.waiting, 
      trend: stats.trends.waiting,
      rate: stats.breakdown.waitingRate,
      icon: Clock, 
      color: "amber",
      description: "紐付け未完了のリスナー",
      cta: "未対応を確認"
    },
    { 
      id: "verified", 
      label: "認証済み (Verified)", 
      count: stats.verified, 
      trend: stats.trends.verified,
      rate: stats.breakdown.verifiedRate,
      icon: Shield, 
      color: "sky",
      description: "パスキー登録済みユーザー",
      cta: "認証済みのみ表示"
    },
    { 
      id: "claimed", 
      label: "受取済 (Claimed)", 
      count: stats.claimed, 
      trend: stats.trends.claimed,
      rate: stats.breakdown.claimedRate,
      icon: CheckCircle2, 
      color: "emerald",
      description: "ファイルの受取完了率",
      cta: "履歴を確認"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item) => {
        const isActive = activeFilter === item.id;
        
        const colorClasses = {
          amber: isActive 
            ? "bg-amber-500/10 border-amber-500/50 shadow-amber-500/10 text-amber-600" 
            : "text-amber-500",
          sky: isActive 
            ? "bg-sky-500/10 border-sky-500/50 shadow-sky-500/10 text-sky-600" 
            : "text-sky-500",
          emerald: isActive 
            ? "bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/10 text-emerald-600" 
            : "text-emerald-500",
        }[item.color as "amber" | "sky" | "emerald"];

        const iconBgClasses = {
          amber: isActive ? "bg-amber-500" : "bg-muted/50",
          sky: isActive ? "bg-sky-500" : "bg-muted/50",
          emerald: isActive ? "bg-emerald-500" : "bg-muted/50",
        }[item.color as "amber" | "sky" | "emerald"];

        return (
          <button
            key={item.id}
            onClick={() => setActiveFilter(isActive ? "all" : (item.id as any))}
            className={cn(
              "flex flex-col p-6 rounded-[2rem] border transition-all text-left relative overflow-hidden group",
              isActive 
                ? `${colorClasses} border-solid shadow-xl` 
                : "bg-background/40 backdrop-blur-md border-white/10 hover:border-white/20 hover:bg-background/60 shadow-lg"
            )}
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity bg-gradient-to-br",
              isActive ? "from-transparent to-transparent" : `from-transparent to-${item.color}-500`
            )} />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-2.5 rounded-2xl transition-all shadow-inner",
                  iconBgClasses,
                  isActive ? "text-white scale-110" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-3xl font-black tracking-tighter transition-colors",
                      isActive ? "" : "text-foreground"
                    )}>
                      {item.count}
                    </span>
                    <div className="flex flex-col items-end mt-0.5">
                      <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">
                        {item.count} of {stats.total} total
                      </span>
                      {item.trend && (
                        <div className={cn(
                          "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1",
                          "isRate" in item.trend && item.trend.isRate ? "bg-emerald-500/10 text-emerald-600" : "bg-sky-500/10 text-sky-600"
                        )}>
                          {"isUp" in item.trend && item.trend.isUp && <TrendingUp className="w-2.5 h-2.5 mr-0.5" />}
                          {item.trend.value}
                        </div>
                      )}
                    </div>
                  </div>
              </div>

              <div className="space-y-1">
                <p className="font-black text-sm uppercase tracking-wide">{item.label}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
              </div>

              <div className="mt-6 space-y-2">
                <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000 ease-out rounded-full",
                      isActive ? "bg-current" : `bg-${item.color}-500/50`
                    )}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
                <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                    {item.cta} <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">Click to focus</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
