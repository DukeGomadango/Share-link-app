"use client";

import { Button } from "@/components/ui/button";
import type { Campaign } from "@/components/features/campaigns/types";
import { useTranslation } from "@/lib/i18n";

interface CampaignBulkActionsProps {
  selectedCount: number;
  onApplyStatus: (status: Campaign["status"]) => void;
  onClearSelection: () => void;
}

const STATUS_ORDER: Campaign["status"][] = ["draft", "active", "completed"];

export function CampaignBulkActions({
  selectedCount,
  onApplyStatus,
  onClearSelection,
}: CampaignBulkActionsProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,900px)] -translate-x-1/2 rounded-xl border border-white/10 bg-black/85 p-3 text-white shadow-2xl backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          {t.campaigns.bulk.selectedCount.replace("{count}", String(selectedCount))}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/70">{t.campaigns.bulk.changeStatusTo}</span>
          {STATUS_ORDER.map((status) => (
            <Button
              key={status}
              size="sm"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/15"
              onClick={() => onApplyStatus(status)}
            >
              {t.campaigns.status[status]}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            className="text-white/80 hover:bg-white/10 hover:text-white"
            onClick={onClearSelection}
          >
            {t.campaigns.bulk.clearSelection}
          </Button>
        </div>
      </div>
    </div>
  );
}
