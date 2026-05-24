"use client";

import { CampaignCard } from "./CampaignCard";
import { CampaignCompactRow } from "./CampaignCompactRow";
import { useIsLgUp } from "@/hooks/useBreakpoint";
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
  const isLgUp = useIsLgUp();

  if (!isLgUp) {
    return (
      <ul className="flex flex-col gap-2">
        {campaigns.map((campaign) => (
          <li key={campaign.id}>
            <CampaignCompactRow
              campaign={campaign}
              isSelected={selectedCampaignIds.has(campaign.id)}
              isFocused={effectiveFocusedCampaignId === campaign.id}
              isHighlighted={rangeHighlightedIds.has(campaign.id)}
              onSelect={(useRange) => onSelect(campaign.id, useRange)}
              onFocus={() => onFocus(campaign.id)}
              formatDate={formatDate}
              isNeedsAttention={isNeedsAttention(campaign)}
              isDueSoon={isDueSoon(campaign)}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
