"use client";

import { create } from "zustand";
import type { CampaignSummary } from "@/components/features/library/types";

interface CommandPaletteLabels {
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
}

export interface CommandPaletteSource {
  selectedCount: number;
  campaigns: CampaignSummary[];
  recentCampaignIds: string[];
  labels: CommandPaletteLabels;
  onAssign: (campaignId: string) => void;
  onOpenRequest: () => void;
}

interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  openRequestId: number;
  source: CommandPaletteSource | null;
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  requestOpen: () => void;
  setSource: (source: CommandPaletteSource | null) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>((set) => ({
  isOpen: false,
  query: "",
  openRequestId: 0,
  source: null,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setQuery: (query) => set({ query }),
  requestOpen: () => set((state) => ({ openRequestId: state.openRequestId + 1 })),
  setSource: (source) => set({ source }),
}));
