"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export function CampaignsHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t.campaigns.title}</h1>
        <p className="mt-1 hidden text-muted-foreground sm:block">{t.campaigns.subtitle}</p>
      </div>
      <Button
        asChild
        size="touch"
        className="w-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 sm:w-auto sm:rounded-full sm:px-6"
      >
        <Link href="/campaigns/new">
          <Plus className="w-4 h-4 mr-2" />
          {t.campaigns.createCampaign}
        </Link>
      </Button>
    </div>
  );
}
