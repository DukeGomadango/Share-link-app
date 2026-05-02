"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export function CampaignsHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.campaigns.title}</h1>
        <p className="text-muted-foreground mt-1">{t.campaigns.subtitle}</p>
      </div>
      <Button
        asChild
        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
      >
        <Link href="/campaigns/new">
          <Plus className="w-4 h-4 mr-2" />
          {t.campaigns.createCampaign}
        </Link>
      </Button>
    </div>
  );
}
