"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

type CampaignAssignFooterProps = {
  selectedCount: number;
  onAssign: () => void;
};

/** ファイル選択中のコンテキスト割当バー（ボトムナビ上） */
export function CampaignAssignFooter({ selectedCount, onAssign }: CampaignAssignFooterProps) {
  const { t } = useTranslation();

  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 flex justify-center px-3 lg:bottom-6"
      role="region"
      aria-label={t.mobile.assignWizardTitle}
    >
      <Button
        type="button"
        size="touch"
        className="w-full max-w-lg bg-emerald-500 text-white shadow-xl hover:bg-emerald-600"
        onClick={onAssign}
      >
        <Users className="mr-2 size-5" />
        {t.mobile.assignWizard} — {t.mobile.assignSelectedFiles.replace("{count}", String(selectedCount))}
      </Button>
    </div>
  );
}
