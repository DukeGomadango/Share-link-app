"use client";

import { CampaignCard } from "./CampaignCard";
import type { Campaign } from "@/components/features/campaigns/types";

interface CampaignsListViewProps {
  campaigns: Campaign[];
  selectedCampaignIds: Set<string>;
  onSelect: (id: string, useRange: boolean) => void;
  onPeek: (campaign: Campaign) => void;
  onFocus: (id: string) => void;
  effectiveFocusedCampaignId: string | null;
  rangeHighlightedIds: Set<string>;
  formatDate: (date: string) => string;
  isNeedsAttention: (campaign: Campaign) => boolean;
  isDueSoon: (campaign: Campaign) => boolean;
  onDelete: (id: string) => void;
}

export function CampaignsListView({
  campaigns,
  selectedCampaignIds,
  onSelect,
  onPeek,
  onFocus,
  effectiveFocusedCampaignId,
  rangeHighlightedIds,
  formatDate,
  isNeedsAttention,
  isDueSoon,
  onDelete,
}: CampaignsListViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          isSelected={selectedCampaignIds.has(campaign.id)}
          isFocused={effectiveFocusedCampaignId === campaign.id}
          isHighlighted={rangeHighlightedIds.has(campaign.id)}
          onSelect={(useRange) => onSelect(campaign.id, useRange)}
          onPeek={() => onPeek(campaign)}
          onFocus={() => onFocus(campaign.id)}
          formatDate={formatDate}
          isNeedsAttention={isNeedsAttention(campaign)}
          isDueSoon={isDueSoon(campaign)}
          onDelete={() => onDelete(campaign.id)}
        />
      ))}
    </div>
  );
}
