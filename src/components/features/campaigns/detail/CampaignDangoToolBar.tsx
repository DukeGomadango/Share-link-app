"use client";

import { ExternalLink, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

type CampaignDangoToolBarProps = {
  isExternalLinked: boolean;
  onOpenDangoTool: () => void;
  onOpenGachaConfig: () => void;
  onStartIntegration: () => void;
  className?: string;
};

/** だんごツール連携のショートカット（設定シートに頼らない表出） */
export function CampaignDangoToolBar({
  isExternalLinked,
  onOpenDangoTool,
  onOpenGachaConfig,
  onStartIntegration,
  className,
}: CampaignDangoToolBarProps) {
  const { t } = useTranslation();

  if (isExternalLinked) {
    return (
      <div className={className}>
        <div className="flex gap-2">
          <Button
            type="button"
            size="touch"
            variant="outline"
            className="min-h-11 flex-1 border-purple-500/30 text-purple-700 hover:bg-purple-500/10 dark:text-purple-300"
            onClick={onOpenDangoTool}
          >
            <ExternalLink className="mr-2 size-4 shrink-0" />
            {t.mobile.openDangoDesign}
          </Button>
          <Button
            type="button"
            size="touch"
            variant="outline"
            className="size-11 shrink-0"
            onClick={onOpenGachaConfig}
            aria-label={t.campaigns.gacha.configTitle}
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        type="button"
        size="touch"
        variant="outline"
        className="min-h-11 w-full border-border/60"
        onClick={onStartIntegration}
      >
        {t.campaigns.gacha.enableTitleStart}
      </Button>
    </div>
  );
}
