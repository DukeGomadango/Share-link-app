"use client";

import Link from "next/link";
import { ChevronRight, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/components/features/campaigns/types";
import { useTranslation } from "@/lib/i18n";

type CampaignCompactRowProps = {
  campaign: Campaign;
  isSelected: boolean;
  isFocused: boolean;
  isHighlighted: boolean;
  formatDate: (date: string) => string;
  isNeedsAttention: boolean;
  isDueSoon: boolean;
  onSelect: (useRange: boolean) => void;
  onFocus: () => void;
};

/** モバイル一覧向けの高密度行（カードより縦スクロール量を抑える） */
export function CampaignCompactRow({
  campaign,
  isSelected,
  isFocused,
  isHighlighted,
  formatDate,
  isNeedsAttention,
  isDueSoon,
  onSelect,
  onFocus,
}: CampaignCompactRowProps) {
  const { t } = useTranslation();

  return (
    <div
      data-campaign-id={campaign.id}
      className={cn(
        "flex min-h-[4.25rem] items-center gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2.5 transition-colors",
        isFocused && "ring-2 ring-emerald-500/40",
        isHighlighted && "ring-2 ring-sky-400/50",
        isSelected && "border-emerald-500/40 bg-emerald-500/5"
      )}
    >
      <label className="flex shrink-0 items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(Boolean((e.nativeEvent as MouseEvent).shiftKey))}
          className="size-4 accent-emerald-500"
          aria-label={campaign.name}
        />
      </label>

      <Link
        href={`/campaigns/${campaign.id}`}
        onFocus={onFocus}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            campaign.status === "active"
              ? "bg-emerald-500/15 text-emerald-600"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Megaphone className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{campaign.name}</p>
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                campaign.status === "active"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : campaign.status === "completed"
                    ? "bg-slate-500/10 text-slate-600"
                    : "bg-amber-500/10 text-amber-600"
              )}
            >
              {t.campaigns.status[campaign.status]}
            </span>
            {campaign.isExternalLinked ? (
              <span className="shrink-0 text-[9px] font-semibold text-purple-600">
                {t.campaigns.gacha.linkedBadge}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {formatDate(campaign.createdAt)}
            {" · "}
            {t.campaigns.files} {campaign.stats.totalFiles}
            {" · "}
            {t.campaigns.assigned} {campaign.stats.assignedRecipients}
            {" · "}
            {t.campaigns.openRate} {campaign.stats.openRate}%
          </p>
          {(isNeedsAttention || isDueSoon) && (
            <p className="mt-0.5 text-[10px] font-medium text-amber-600">
              {isNeedsAttention ? t.campaigns.quickFilters.needsAttention : null}
              {isNeedsAttention && isDueSoon ? " · " : null}
              {isDueSoon ? t.campaigns.quickFilters.dueSoon : null}
            </p>
          )}
        </div>

        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </div>
  );
}
