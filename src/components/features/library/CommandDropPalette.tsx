"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Keyboard, Search } from "lucide-react";
import { CampaignSummary } from "@/components/features/library/types";

interface CommandDropPaletteProps {
  isOpen: boolean;
  selectedCount: number;
  query: string;
  campaigns: CampaignSummary[];
  recentCampaignIds: string[];
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onAssign: (campaignId: string) => void;
  labels: {
    title: string;
    subtitle: string;
    placeholder: string;
    empty: string;
    shortcutsHint: string;
    shortcutsTitle: string;
    shortcutMove: string;
    shortcutSelect: string;
    shortcutClose: string;
    shortcutToggleHelp: string;
    recentBadge: string;
  };
}

export function CommandDropPalette({
  isOpen,
  selectedCount,
  query,
  campaigns,
  recentCampaignIds,
  onQueryChange,
  onClose,
  onAssign,
  labels,
}: CommandDropPaletteProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const recentSet = new Set(recentCampaignIds);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "?" || (event.key === "/" && event.shiftKey)) {
        event.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 flex items-center justify-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <Command className="relative w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/70">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{labels.title}</p>
              <p className="text-xs text-muted-foreground">
                {labels.subtitle.replace("{count}", String(selectedCount))}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowShortcuts((prev) => !prev)}
              className="text-xs rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-foreground"
            >
              <span className="inline-flex items-center gap-1">
                <Keyboard className="w-3.5 h-3.5" />
                {labels.shortcutsHint}
              </span>
            </button>
          </div>
        </div>
        <div className="flex items-center px-3 border-b border-border/70">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <Command.Input
            value={query}
            onValueChange={onQueryChange}
            placeholder={labels.placeholder}
            className="w-full h-11 bg-transparent text-sm outline-none"
            autoFocus
          />
        </div>
        <Command.List className="max-h-[420px] overflow-y-auto p-2">
          {showShortcuts ? (
            <div className="mb-2 rounded-md border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground mb-1">{labels.shortcutsTitle}</p>
              <p>{labels.shortcutMove}</p>
              <p>{labels.shortcutSelect}</p>
              <p>{labels.shortcutClose}</p>
              <p>{labels.shortcutToggleHelp}</p>
            </div>
          ) : null}
          <Command.Empty className="text-sm text-muted-foreground px-2 py-6 text-center">
            {labels.empty}
          </Command.Empty>
          {campaigns.map((campaign) => (
            <Command.Item
              key={campaign.id}
              value={campaign.name}
              onSelect={() => onAssign(campaign.id)}
              className="px-3 py-2 rounded-md text-sm cursor-pointer data-[selected=true]:bg-emerald-500/15 data-[selected=true]:text-emerald-600 flex items-center justify-between gap-2"
            >
              <span className="truncate">{campaign.name}</span>
              {recentSet.has(campaign.id) ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                  {labels.recentBadge}
                </span>
              ) : null}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
