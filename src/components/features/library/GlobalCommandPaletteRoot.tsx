"use client";

import { useEffect } from "react";
import { CommandDropPalette } from "@/components/features/library/CommandDropPalette";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";

export function GlobalCommandPaletteRoot() {
  const isOpen = useCommandPaletteStore((state) => state.isOpen);
  const query = useCommandPaletteStore((state) => state.query);
  const setQuery = useCommandPaletteStore((state) => state.setQuery);
  const close = useCommandPaletteStore((state) => state.close);
  const openRequestId = useCommandPaletteStore((state) => state.openRequestId);
  const source = useCommandPaletteStore((state) => state.source);

  useEffect(() => {
    if (openRequestId === 0 || !source) return;
    source.onOpenRequest();
  }, [openRequestId, source]);

  if (!source) return null;

  return (
    <CommandDropPalette
      isOpen={isOpen}
      selectedCount={source.selectedCount}
      query={query}
      campaigns={source.campaigns}
      recentCampaignIds={source.recentCampaignIds}
      onQueryChange={setQuery}
      onClose={() => {
        close();
        setQuery("");
      }}
      onAssign={source.onAssign}
      labels={source.labels}
    />
  );
}
