"use client";

import { cn } from "@/lib/utils";
import type { RecipientFilter } from "@/components/features/campaigns/types";
import { useTranslation } from "@/lib/i18n";

interface RecipientStatsCompactProps {
  stats: {
    waiting: number;
    verified: number;
    claimed: number;
    total: number;
  };
  activeFilter: RecipientFilter;
  setActiveFilter: (filter: RecipientFilter) => void;
}

export function RecipientStatsCompact({
  stats,
  activeFilter,
  setActiveFilter,
}: RecipientStatsCompactProps) {
  const { t } = useTranslation();

  const chips: { id: RecipientFilter; label: string; count: number }[] = [
    { id: "all", label: "すべて", count: stats.total },
    { id: "waiting", label: "待機", count: stats.waiting },
    { id: "verified", label: "認証済", count: stats.verified },
    { id: "claimed", label: "受取済", count: stats.claimed },
    { id: "noTags", label: "タグなし", count: 0 },
  ];

  return (
    <div className="space-y-2 md:hidden">
      <p className="text-xs text-muted-foreground">
        {t.mobile.recipientsSummary
          .replace("{total}", String(stats.total))
          .replace("{waiting}", String(stats.waiting))
          .replace("{claimed}", String(stats.claimed))}
      </p>
      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setActiveFilter(chip.id)}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold",
              activeFilter === chip.id
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-border/60 bg-background text-muted-foreground"
            )}
          >
            {chip.label}
            {chip.id !== "noTags" ? (
              <span className="tabular-nums text-[10px] opacity-80">{chip.count}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
