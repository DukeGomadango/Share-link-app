"use client";

import { Megaphone, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import type { Campaign } from "@/components/features/campaigns/types";
import { useTranslation } from "@/lib/i18n";

interface CampaignCardProps {
  campaign: Campaign;
  isFocused: boolean;
  isHighlighted: boolean;
  isSelected: boolean;
  onSelect: (useRange: boolean) => void;
  onPeek: () => void;
  onFocus: () => void;
  formatDate: (date: string) => string;
  isNeedsAttention: boolean;
  isDueSoon: boolean;
}

export function CampaignCard({
  campaign,
  isFocused,
  isHighlighted,
  isSelected,
  onSelect,
  onPeek,
  onFocus,
  formatDate,
  isNeedsAttention,
  isDueSoon,
}: CampaignCardProps) {
  const { t } = useTranslation();

  const getStatusPillClass = (status: Campaign["status"]) => {
    if (status === "active") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (status === "completed") return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <GlassCard
      data-campaign-id={campaign.id}
      tabIndex={0}
      className={`relative group hover:border-emerald-500/50 transition-colors cursor-pointer outline-none ${
        isFocused ? "ring-2 ring-emerald-500/50" : ""
      } ${isHighlighted ? "ring-2 ring-sky-400/60" : ""}`}
      onClick={onPeek}
      onFocus={onFocus}
    >
      <label className="absolute left-4 top-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(event) =>
            onSelect(Boolean((event.nativeEvent as MouseEvent).shiftKey))
          }
          onClick={(event) => event.stopPropagation()}
          className="h-4 w-4 accent-emerald-500"
        />
      </label>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3 pl-6">
          <div
            className={`p-2 rounded-md ${
              campaign.status === "active"
                ? "bg-emerald-500/20 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{campaign.name}</h3>
            <p className="text-xs text-muted-foreground">{formatDate(campaign.createdAt)}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-xs ${getStatusPillClass(campaign.status)}`}>
          {t.campaigns.status[campaign.status]}
        </span>
        {isNeedsAttention && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
            {t.campaigns.quickFilters.needsAttention}
          </span>
        )}
        {isDueSoon && (
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs text-purple-300">
            {t.campaigns.quickFilters.dueSoon}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{t.campaigns.files}</p>
          <p className="font-semibold">{campaign.stats.totalFiles}</p>
        </div>
        <div className="text-center border-x border-border/50">
          <p className="text-xs text-muted-foreground mb-1">{t.campaigns.assigned}</p>
          <p className="font-semibold">{campaign.stats.assignedRecipients}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{t.campaigns.openRate}</p>
          <p className="font-semibold">{campaign.stats.openRate}%</p>
        </div>
      </div>

      <Button
        asChild
        variant="outline"
        className="w-full glass group-hover:bg-emerald-500 group-hover:text-white hover:bg-emerald-600 hover:text-white transition-colors border-border/50"
        onClick={(event) => event.stopPropagation()}
      >
        <Link href={`/campaigns/${campaign.id}`}>{t.common.manage}</Link>
      </Button>
    </GlassCard>
  );
}
