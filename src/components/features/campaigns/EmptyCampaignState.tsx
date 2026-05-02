"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { useTranslation } from "@/lib/i18n";

export function EmptyCampaignState() {
  const { t } = useTranslation();

  return (
    <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
        <Megaphone className="w-8 h-8 text-emerald-500" />
      </div>
      <h2 className="text-xl font-semibold mb-2">{t.campaigns.noCampaignsTitle}</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {t.campaigns.noCampaignsDescription}
      </p>
      <Button asChild className="bg-emerald-500">
        <Link href="/campaigns/new">{t.campaigns.createCampaign}</Link>
      </Button>
    </GlassCard>
  );
}
