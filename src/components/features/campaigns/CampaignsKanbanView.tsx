"use client";

import { GlassCard } from "@/components/shared/GlassCard";
import type { Campaign } from "@/components/features/campaigns/types";
import { useTranslation } from "@/lib/i18n";

interface CampaignsKanbanViewProps {
  groupedCampaigns: Record<Campaign["status"], Campaign[]>;
  selectedCampaignIds: Set<string>;
  onSelect: (id: string, useRange: boolean) => void;
  onPeek: (campaign: Campaign) => void;
  onFocus: (id: string) => void;
  effectiveFocusedCampaignId: string | null;
  rangeHighlightedIds: Set<string>;
  formatDate: (date: string) => string;
  isNeedsAttention: (campaign: Campaign) => boolean;
  isDueSoon: (campaign: Campaign) => boolean;
}

const STATUS_ORDER: Campaign["status"][] = ["draft", "active", "completed"];

export function CampaignsKanbanView({
  groupedCampaigns,
  selectedCampaignIds,
  onSelect,
  onPeek,
  onFocus,
  effectiveFocusedCampaignId,
  rangeHighlightedIds,
  formatDate,
  isNeedsAttention,
  isDueSoon,
}: CampaignsKanbanViewProps) {
  const { t } = useTranslation();

  const getStatusPillClass = (status: Campaign["status"]) => {
    if (status === "active") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (status === "completed") return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {STATUS_ORDER.map((status) => (
        <GlassCard key={status} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className={`rounded-full border px-2.5 py-1 text-xs ${getStatusPillClass(status)}`}>
              {t.campaigns.status[status]}
            </span>
            <span className="text-xs text-muted-foreground">{groupedCampaigns[status].length}</span>
          </div>
          <div className="space-y-3">
            {groupedCampaigns[status].map((campaign) => (
              <div
                key={campaign.id}
                data-campaign-id={campaign.id}
                tabIndex={0}
                className={`rounded-lg border border-border/70 bg-background/50 p-3 cursor-pointer hover:border-emerald-500/50 transition-colors outline-none ${
                  effectiveFocusedCampaignId === campaign.id ? "ring-2 ring-emerald-500/50" : ""
                } ${
                  rangeHighlightedIds.has(campaign.id) ? "ring-2 ring-sky-400/60" : ""
                }`}
                onClick={() => onPeek(campaign)}
                onFocus={() => onFocus(campaign.id)}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCampaignIds.has(campaign.id)}
                    onChange={(event) =>
                      onSelect(campaign.id, Boolean((event.nativeEvent as MouseEvent).shiftKey))
                    }
                    onClick={(event) => event.stopPropagation()}
                    className="mt-0.5 h-4 w-4 accent-emerald-500"
                  />
                  <p className="text-sm font-medium line-clamp-1">{campaign.name}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(campaign.createdAt)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {isNeedsAttention(campaign) && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
                      {t.campaigns.quickFilters.needsAttention}
                    </span>
                  )}
                  {isDueSoon(campaign) && (
                    <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
                      {t.campaigns.quickFilters.dueSoon}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span>{t.campaigns.files}: {campaign.stats.totalFiles}</span>
                  <span>{t.campaigns.openRate}: {campaign.stats.openRate}%</span>
                </div>
              </div>
            ))}
            {groupedCampaigns[status].length === 0 && (
              <div className="rounded-lg border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
                {t.campaigns.emptyColumn}
              </div>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
