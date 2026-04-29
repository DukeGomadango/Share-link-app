"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { CampaignSummary } from "./types";

interface AssetAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  campaignQuery: string;
  onCampaignQueryChange: (query: string) => void;
  assignTargetCampaignId: string;
  onAssignTargetCampaignIdChange: (id: string) => void;
  filteredCampaigns: CampaignSummary[];
  onAssign: (campaignId: string) => void;
  isAssigning: boolean;
  labels: {
    title: string;
    selectedAssets: string;
    searchCampaign: string;
    searchPlaceholder: string;
    selectCampaign: string;
    noResults: string;
    cancel: string;
    assignNow: string;
  };
}

export function AssetAssignModal({
  isOpen,
  onClose,
  selectedCount,
  campaignQuery,
  onCampaignQueryChange,
  assignTargetCampaignId,
  onAssignTargetCampaignIdChange,
  filteredCampaigns,
  onAssign,
  isAssigning,
  labels,
}: AssetAssignModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md">
        <h3 className="text-lg font-semibold mb-1">{labels.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {labels.selectedAssets.replace("{count}", String(selectedCount))}
        </p>
        <label className="text-sm font-medium mb-2 block">{labels.searchCampaign}</label>
        <input
          value={campaignQuery}
          onChange={(event) => onCampaignQueryChange(event.target.value)}
          placeholder={labels.searchPlaceholder}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-4"
        />
        <label className="text-sm font-medium mb-2 block">{labels.selectCampaign}</label>
        <select
          value={assignTargetCampaignId}
          onChange={(event) => onAssignTargetCampaignIdChange(event.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
        >
          {filteredCampaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>
        {filteredCampaigns.length === 0 ? (
          <p className="text-xs text-muted-foreground mt-2">{labels.noResults}</p>
        ) : null}
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            className="bg-emerald-500 text-white hover:bg-emerald-600"
            onClick={() => onAssign(assignTargetCampaignId)}
            disabled={
              !assignTargetCampaignId ||
              selectedCount === 0 ||
              filteredCampaigns.length === 0 ||
              isAssigning
            }
          >
            {isAssigning ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : null}
            {labels.assignNow}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
