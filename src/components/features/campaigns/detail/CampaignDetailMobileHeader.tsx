"use client";

import Link from "next/link";
import { ChevronLeft, Settings, Link as LinkIcon, Megaphone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { Campaign } from "@/components/features/campaigns/types";

type CampaignDetailMobileHeaderProps = {
  campaign: Campaign | null;
  workflowLoading: boolean;
  liveViewers: number;
  statusBusy: boolean;
  selectedFileCount: number;
  onOpenSettings: () => void;
  onOpenAssignWizard: () => void;
  onPublishAction: () => void;
  onCopyReceptionUrl?: () => void;
};

export function CampaignDetailMobileHeader({
  campaign,
  workflowLoading,
  liveViewers,
  statusBusy,
  selectedFileCount,
  onOpenSettings,
  onOpenAssignWizard,
  onPublishAction,
  onCopyReceptionUrl,
}: CampaignDetailMobileHeaderProps) {
  const { t } = useTranslation();

  const showCopyUrl =
    campaign?.securityLevel === "standard" &&
    campaign.distributionMode === "reception" &&
    campaign.publicReceptionToken &&
    campaign.status === "active" &&
    onCopyReceptionUrl;

  return (
    <header className="space-y-3 lg:hidden">
      <div className="flex items-start gap-2">
        <Link
          href="/campaigns"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background"
          aria-label={t.common.back}
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            {t.campaigns.directCampaign}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight">
              {workflowLoading ? "…" : campaign?.name ?? t.campaigns.campaignFlow}
            </h1>
            {campaign ? (
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                  campaign.status === "active"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                    : campaign.status === "completed"
                      ? "border-slate-500/20 bg-slate-500/10 text-slate-600"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                )}
              >
                {t.campaigns.status[campaign.status]}
              </span>
            ) : null}
            {liveViewers > 0 ? (
              <span className="text-[10px] font-bold text-emerald-600">LIVE {liveViewers}</span>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          onClick={onOpenSettings}
          aria-label={t.mobile.settings}
        >
          <Settings className="size-5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedFileCount > 0 ? (
          <Button
            type="button"
            size="touch"
            className="min-h-11 flex-1 bg-emerald-500 text-white hover:bg-emerald-600"
            onClick={onOpenAssignWizard}
          >
            <Users className="mr-2 size-4" />
            {t.mobile.assignWizard} ({selectedFileCount})
          </Button>
        ) : null}
        {showCopyUrl ? (
          <Button
            type="button"
            variant="outline"
            size="touch"
            className="min-h-11 flex-1"
            onClick={onCopyReceptionUrl}
          >
            <LinkIcon className="mr-2 size-4" />
            受付URL
          </Button>
        ) : (
          <Button
            type="button"
            size="touch"
            className={cn(
              "min-h-11 flex-1",
              campaign?.status === "draft"
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : ""
            )}
            variant={campaign?.status === "draft" ? "default" : "outline"}
            disabled={workflowLoading || statusBusy}
            onClick={onPublishAction}
          >
            <Megaphone className="mr-2 size-4" />
            {campaign?.status === "active"
              ? "終了する"
              : campaign?.status === "completed"
                ? "再開"
                : "公開する"}
          </Button>
        )}
      </div>
    </header>
  );
}
