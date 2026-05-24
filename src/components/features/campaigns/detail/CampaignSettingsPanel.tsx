"use client";

import {
  Calendar,
  Download,
  ExternalLink,
  Link as LinkIcon,
  Megaphone,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { hasGachaConfigHistory } from "@/lib/campaigns/external-link-mode";
import type { CampaignSettingsPanelProps } from "@/components/features/campaigns/detail/campaign-settings-types";

export function CampaignSettingsPanel({
  campaign,
  campaignId: _campaignId,
  workflowLoading,
  statusBusy,
  exportBusy,
  isDeleting,
  integrationBusy,
  isPublic,
  gachaWasConfigured,
  layout = "sheet",
  onPublishAction,
  onExportCsv,
  onDelete,
  onSecurityChange,
  onIntegrationToggle,
  onOpenGachaConfig,
  onOpenDangoTool,
  onDistributionModeChange,
  onExpiresAtChange,
  onClearExpiresAt,
  onCopyReceptionUrl,
  onAfterPublishClick,
}: CampaignSettingsPanelProps) {
  const { t } = useTranslation();
  const locked = campaign.isExternalLinked;
  const btnSize = layout === "sheet" ? "touch" : "default";

  return (
    <div className={cn("space-y-6", layout === "inline" && "space-y-8")}>
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          キャンペーン
        </h3>
        <Button
          type="button"
          size={btnSize}
          className="w-full"
          variant={campaign.status === "draft" ? "default" : "outline"}
          disabled={workflowLoading || statusBusy}
          onClick={() => {
            onPublishAction();
            onAfterPublishClick?.();
          }}
        >
          <Megaphone className="mr-2 size-4" />
          {campaign.status === "active"
            ? "公開中（終了する）"
            : campaign.status === "completed"
              ? "終了済み（再開する）"
              : "キャンペーンを公開する"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size={btnSize}
          className="w-full"
          disabled={workflowLoading || exportBusy}
          onClick={onExportCsv}
        >
          <Download className="mr-2 size-4" />
          {exportBusy ? t.campaigns.exporting : t.campaigns.exportLinks}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size={btnSize}
          className="w-full text-destructive hover:bg-destructive/10"
          disabled={workflowLoading || isDeleting}
          onClick={onDelete}
        >
          <Trash2 className="mr-2 size-4" />
          {t.common.delete}
        </Button>
      </section>

      <section className="space-y-3 border-t border-border/40 pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          配布モード
        </h3>
        {campaign.isExternalLinked ? (
          <p className="text-xs text-muted-foreground">{t.campaigns.gacha.lockedHint}</p>
        ) : null}
        <div className="flex rounded-xl border border-border/50 bg-muted/30 p-1">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-lg text-sm font-bold",
              layout === "sheet" ? "min-h-11" : "px-3 py-2",
              isPublic ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground"
            )}
            disabled={statusBusy || locked}
            onClick={() => onSecurityChange("standard")}
          >
            公開
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-lg text-sm font-bold",
              layout === "sheet" ? "min-h-11" : "px-3 py-2",
              !isPublic ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground"
            )}
            disabled={statusBusy || locked}
            onClick={() => onSecurityChange("high")}
          >
            限定
          </button>
        </div>
        {!isPublic && (
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">配布方式</span>
            <select
              className={cn(
                "w-full rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                layout === "sheet" ? "min-h-11" : "py-2"
              )}
              value={campaign.distributionMode ?? "per_link"}
              disabled={statusBusy || locked}
              onChange={(e) => onDistributionModeChange(e.target.value)}
            >
              <option value="per_link">個別リンク（手渡し）</option>
              <option value="reception">共通受付（チェックイン）</option>
            </select>
          </label>
        )}
      </section>

      <section className="space-y-3 border-t border-border/40 pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t.campaigns.gacha.linkedBadge}
        </h3>
        <Button
          type="button"
          variant="outline"
          size={btnSize}
          className="w-full"
          disabled={integrationBusy}
          onClick={() => onIntegrationToggle(campaign.isExternalLinked ? "pause" : "enable")}
        >
          <LinkIcon className="mr-2 size-4" />
          {campaign.isExternalLinked
            ? t.campaigns.gacha.disableTitle
            : gachaWasConfigured
              ? t.campaigns.gacha.enableTitleResume
              : t.campaigns.gacha.enableTitleStart}
        </Button>
        {campaign.isExternalLinked ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size={btnSize}
              className="min-h-11 flex-1"
              onClick={onOpenDangoTool}
            >
              <ExternalLink className="mr-2 size-4" />
              {t.mobile.openDangoDesign}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11"
              onClick={onOpenGachaConfig}
              aria-label={t.campaigns.gacha.configTitle}
            >
              <Settings className="size-4" />
            </Button>
          </div>
        ) : null}
        {!hasGachaConfigHistory(campaign.gachaConfig ?? null) && !campaign.isExternalLinked ? (
          <p className="text-xs text-muted-foreground">{t.campaigns.gacha.enableConfirmDescription}</p>
        ) : null}
      </section>

      <section className="space-y-2 border-t border-border/40 pt-4">
        <h3 className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Calendar className="size-3.5" />
          有効期限
        </h3>
        <input
          type="datetime-local"
          className={cn(
            "w-full rounded-xl border border-border/60 bg-background px-3 text-sm",
            layout === "sheet" ? "min-h-11" : "py-2"
          )}
          value={
            campaign.expiresAt
              ? new Date(
                  new Date(campaign.expiresAt).getTime() -
                    new Date().getTimezoneOffset() * 60000
                )
                  .toISOString()
                  .slice(0, 16)
              : ""
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v) onExpiresAtChange(new Date(v).toISOString());
          }}
        />
        {campaign.expiresAt ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClearExpiresAt}>
            <X className="mr-1 size-3" />
            期限をクリア
          </Button>
        ) : null}
      </section>

      {campaign.distributionMode === "reception" &&
      campaign.publicReceptionToken &&
      onCopyReceptionUrl ? (
        <section className="border-t border-border/40 pt-4">
          <Button
            type="button"
            variant="outline"
            size={btnSize}
            className="w-full"
            disabled={campaign.status !== "active"}
            onClick={onCopyReceptionUrl}
          >
            受付URLをコピー
          </Button>
        </section>
      ) : null}
    </div>
  );
}
