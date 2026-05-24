"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export type CampaignWorkTab = "files" | "recipients";

type CampaignDetailWorkTabsProps = {
  value: CampaignWorkTab;
  onChange: (tab: CampaignWorkTab) => void;
  fileCount: number;
  recipientCount: number;
};

export function CampaignDetailWorkTabs({
  value,
  onChange,
  fileCount,
  recipientCount,
}: CampaignDetailWorkTabsProps) {
  const { t } = useTranslation();

  const tabs: { id: CampaignWorkTab; label: string; count: number }[] = [
    { id: "files", label: t.mobile.tabFiles, count: fileCount },
    { id: "recipients", label: t.mobile.tabRecipients, count: recipientCount },
  ];

  return (
    <div
      className="flex rounded-xl border border-border/60 bg-muted/40 p-1 lg:hidden"
      role="tablist"
      aria-label={t.mobile.tabFiles}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={cn(
            "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors",
            value === tab.id
              ? "bg-background text-emerald-600 shadow-sm dark:text-emerald-400"
              : "text-muted-foreground"
          )}
          onClick={() => onChange(tab.id)}
        >
          <span>{tab.label}</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
              value === tab.id ? "bg-emerald-500/15 text-emerald-600" : "bg-muted"
            )}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
