"use client";

import {
  Download,
  ExternalLink,
  Link as LinkIcon,
  Megaphone,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { Campaign } from "@/components/features/campaigns/types";

type CampaignDetailDesktopHeaderProps = {
  campaign: Campaign | null;
  campaignId: string | null;
  workflowLoading: boolean;
  liveViewers: number;
  statusBusy: boolean;
  exportBusy: boolean;
  isDeleting: boolean;
  onOpenSettings: () => void;
  onPublishAction: () => void;
  onExportCsv: () => void;
  onDelete: () => void;
  onCopyReceptionUrl?: () => void;
  showReceptionCopy: boolean;
  isExternalLinked?: boolean;
  onOpenDangoTool?: () => void;
  onOpenGachaConfig?: () => void;
};

export function CampaignDetailDesktopHeader({
  campaign,
  campaignId,
  workflowLoading,
  liveViewers,
  statusBusy,
  exportBusy,
  isDeleting,
  onOpenSettings,
  onPublishAction,
  onExportCsv,
  onDelete,
  onCopyReceptionUrl,
  showReceptionCopy,
  isExternalLinked = false,
  onOpenDangoTool,
  onOpenGachaConfig,
}: CampaignDetailDesktopHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="hidden shrink-0 items-start justify-between gap-4 lg:flex">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-sm text-emerald-500">
          <span className="text-xs font-semibold uppercase tracking-wider">
            {t.campaigns.directCampaign}
          </span>
          <span>•</span>
          <span className="font-mono text-xs text-muted-foreground">{campaign?.id ?? "…"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="truncate text-2xl font-bold tracking-tight xl:text-3xl">
            {workflowLoading ? "…" : campaign?.name ?? t.campaigns.campaignFlow}
          </h1>
          {campaign ? (
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                campaign.status === "active"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                  : campaign.status === "completed"
                    ? "border-slate-500/20 bg-slate-500/10 text-slate-500"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-500"
              )}
            >
              {t.campaigns.status[campaign.status]}
            </span>
          ) : null}
          {liveViewers > 0 ? (
            <span className="text-[10px] font-bold uppercase tracking-tight text-emerald-600">
              LIVE {liveViewers}
            </span>
          ) : null}
        </div>
        {campaign?.isExternalLinked ? (
          <p className="mt-2 text-xs text-purple-600">{t.campaigns.gacha.linkedBadge}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {isExternalLinked && onOpenDangoTool ? (
          <>
            <Button type="button" variant="outline" onClick={onOpenDangoTool}>
              <ExternalLink className="mr-2 size-4" />
              {t.mobile.openDangoDesign}
            </Button>
            {onOpenGachaConfig ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9"
                onClick={onOpenGachaConfig}
                aria-label={t.campaigns.gacha.configTitle}
              >
                <Settings className="size-4" />
              </Button>
            ) : null}
          </>
        ) : null}
        {showReceptionCopy && onCopyReceptionUrl ? (
          <Button type="button" variant="outline" onClick={onCopyReceptionUrl}>
            <LinkIcon className="mr-2 size-4" />
            受付URLをコピー
          </Button>
        ) : null}
        <Button
          type="button"
          className={cn(
            "shadow-lg",
            campaign?.status === "draft"
              ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600"
              : ""
          )}
          variant={campaign?.status === "draft" ? "default" : "outline"}
          disabled={workflowLoading || !campaignId || statusBusy}
          onClick={onPublishAction}
        >
          {campaign?.status === "active" ? (
            <span className="mr-2 inline-block size-2 animate-pulse rounded-full bg-emerald-500" />
          ) : (
            <Megaphone className="mr-2 size-4" />
          )}
          {campaign?.status === "active"
            ? "公開中（終了する）"
            : campaign?.status === "completed"
              ? "終了済み（再開する）"
              : "キャンペーンを公開する"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={workflowLoading || !campaignId || exportBusy}
          onClick={onExportCsv}
        >
          <Download className="mr-2 size-4" />
          {exportBusy ? t.campaigns.exporting : t.campaigns.exportLinks}
        </Button>
        <Button type="button" variant="outline" onClick={onOpenSettings}>
          <Settings className="mr-2 size-4" />
          {t.mobile.settings}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          disabled={workflowLoading || !campaignId || isDeleting}
          onClick={onDelete}
        >
          <Trash2 className="mr-2 size-4" />
          {t.common.delete}
        </Button>
      </div>
    </header>
  );
}
