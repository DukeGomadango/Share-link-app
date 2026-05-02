"use client";

import { Button } from "@/components/ui/button";
import type { Campaign } from "@/components/features/campaigns/types";
import { useTranslation } from "@/lib/i18n";

interface CampaignUndoToastProps {
  bulkUndo: {
    previousStatuses: Record<string, Campaign["status"]>;
    nextStatus: Campaign["status"];
  } | null;
  onUndo: () => void;
}

export function CampaignUndoToast({ bulkUndo, onUndo }: CampaignUndoToastProps) {
  const { t } = useTranslation();

  if (!bulkUndo) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-background/95 px-4 py-3 shadow-xl backdrop-blur">
      <div className="flex items-center gap-3">
        <p className="text-sm">
          {t.campaigns.bulk.undoMessage
            .replace("{count}", String(Object.keys(bulkUndo.previousStatuses).length))
            .replace("{status}", t.campaigns.status[bulkUndo.nextStatus])}
        </p>
        <Button size="sm" variant="outline" onClick={onUndo}>
          {t.campaigns.bulk.undo}
        </Button>
      </div>
    </div>
  );
}
