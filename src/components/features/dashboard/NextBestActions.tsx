"use client";

import { BentoItem } from "@/components/shared/BentoGrid";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import type { TranslationKeys } from "@/lib/i18n/locales/ja";

interface NextBestActionsProps {
  unassignedAssets: number;
  onQuickAssign: () => void;
  t: TranslationKeys;
}

export function NextBestActions({ unassignedAssets, onQuickAssign, t }: NextBestActionsProps) {
  return (
    <BentoItem colSpan={2} className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{t.dashboard.todayFocus}</p>
          <h2 className="text-2xl font-bold mt-1">{t.dashboard.nextBestActionsTitle}</h2>
          <p className="text-sm text-muted-foreground mt-2">{t.dashboard.nextBestActionsDescription}</p>
          <p className="text-xs mt-2 text-muted-foreground">
            {t.dashboard.unassignedAssetsHint.replace("{count}", String(unassignedAssets))}
          </p>
        </div>
        <div className="p-3 bg-blue-500/20 rounded-full shrink-0">
          <Sparkles className="w-6 h-6 text-blue-500" />
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Button asChild className="justify-between">
          <Link href="/campaigns/new">
            {t.dashboard.actionCreateCampaign}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button
          variant="outline"
          className="justify-between"
          disabled={unassignedAssets === 0}
          onClick={onQuickAssign}
        >
          {t.dashboard.actionAssignUnassigned}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </BentoItem>
  );
}
