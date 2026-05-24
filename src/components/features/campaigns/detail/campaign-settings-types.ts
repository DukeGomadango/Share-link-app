import type { Campaign } from "@/components/features/campaigns/types";

export type CampaignSettingsPanelProps = {
  campaign: Campaign;
  campaignId: string;
  workflowLoading: boolean;
  statusBusy: boolean;
  exportBusy: boolean;
  isDeleting: boolean;
  integrationBusy: boolean;
  isPublic: boolean;
  gachaWasConfigured: boolean;
  layout?: "sheet" | "inline";
  onPublishAction: () => void;
  onExportCsv: () => void;
  onDelete: () => void;
  onSecurityChange: (level: "standard" | "high") => void;
  onIntegrationToggle: (action: "enable" | "pause") => void;
  onOpenGachaConfig: () => void;
  onOpenDangoTool: () => void;
  onDistributionModeChange: (mode: string) => void;
  onExpiresAtChange: (iso: string) => void;
  onClearExpiresAt: () => void;
  onCopyReceptionUrl?: () => void;
  /** シート内で公開ボタン押下後に閉じる */
  onAfterPublishClick?: () => void;
};
