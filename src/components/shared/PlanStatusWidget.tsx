"use client";

import Link from "next/link";
import { Crown, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

interface PlanStatusWidgetProps {
  planTier?: "free" | "pro";
  billingTier?: "pro" | "supporter" | null;
  usedBytes?: number;
  limitBytes?: number;
  className?: string;
}

export function PlanStatusWidget({
  planTier = "free",
  billingTier = null,
  usedBytes = 0,
  limitBytes = 2_147_483_648,
  className,
}: PlanStatusWidgetProps) {
  const { t } = useTranslation();
  const isFree = planTier === "free";
  const planLabel = isFree
    ? t.plan.free
    : billingTier === "supporter"
      ? t.billing.statusSupporter
      : t.plan.pro;
  const percentage = Math.min(
    100,
    limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  };

  return (
    <div
      className={cn(
        "px-4 py-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center",
              isFree
                ? "bg-muted text-muted-foreground"
                : "bg-emerald-500 text-white"
            )}
          >
            {isFree ? <Info className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">{planLabel}</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          {percentage}%
        </span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>
              {formatBytes(usedBytes)} {t.plan.used}
            </span>
            <span>
              {formatBytes(limitBytes)} {t.plan.limit}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {isFree ? t.plan.retentionFree : t.plan.retentionPro}
        </p>

        {isFree && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg group"
            title={t.plan.upgradeHint}
            asChild
          >
            <Link href="/settings/billing">
              <Zap className="w-3 h-3 mr-1 fill-current" />
              {t.plan.upgrade}
            </Link>
          </Button>
        )}
        {!isFree && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-[10px] font-bold rounded-lg"
            asChild
          >
            <Link href="/settings/billing">{t.billing.manageSubscription}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
