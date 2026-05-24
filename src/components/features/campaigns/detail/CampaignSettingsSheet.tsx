"use client";

import { Sheet, SheetBody, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTranslation } from "@/lib/i18n";
import { CampaignSettingsPanel } from "@/components/features/campaigns/detail/CampaignSettingsPanel";
import type { CampaignSettingsPanelProps } from "@/components/features/campaigns/detail/campaign-settings-types";
import type { Campaign } from "@/components/features/campaigns/types";

type CampaignSettingsSheetProps = Omit<
  CampaignSettingsPanelProps,
  "campaign" | "layout" | "campaignId"
> & {
  open: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  campaignId: string | null;
};

export function CampaignSettingsSheet({
  open,
  onClose,
  campaign,
  campaignId,
  ...panelProps
}: CampaignSettingsSheetProps) {
  const { t } = useTranslation();

  if (!campaign || !campaignId) return null;

  return (
    <Sheet isOpen={open} onClose={onClose}>
      <SheetHeader className="px-4 pt-8 pb-2">
        <SheetTitle>{t.mobile.settings}</SheetTitle>
      </SheetHeader>
      <SheetBody className="px-4 pb-10">
        <CampaignSettingsPanel
          campaign={campaign}
          campaignId={campaignId}
          layout="sheet"
          onAfterPublishClick={onClose}
          {...panelProps}
        />
      </SheetBody>
    </Sheet>
  );
}
