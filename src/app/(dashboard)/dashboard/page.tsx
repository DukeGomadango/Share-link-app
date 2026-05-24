"use client";

import { useCallback, useEffect, useState } from "react";
import { BentoGrid } from "@/components/shared/BentoGrid";
import { useTranslation } from "@/lib/i18n";
import type { DashboardOverviewStats } from "@/lib/stats/overview";
import { LibraryToasts } from "@/components/features/library/LibraryToasts";
import type { AssignResult, CampaignSummary } from "@/components/features/library/types";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";
import { useRegisterCommandPaletteSource } from "@/hooks/features/library/useRegisterCommandPaletteSource";
import { useWorkspaceLibrary } from "@/context/WorkspaceLibraryContext";

import { DashboardHeader } from "@/components/features/dashboard/DashboardHeader";
import { NextBestActions } from "@/components/features/dashboard/NextBestActions";
import { StatCards } from "@/components/features/dashboard/StatCards";
import { InsightCards } from "@/components/features/dashboard/InsightCards";
import { DashboardStatsCompact } from "@/components/features/dashboard/DashboardStatsCompact";
import { CollapsibleCallout } from "@/components/shared/CollapsibleCallout";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardOverviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [unassignedFileIds, setUnassignedFileIds] = useState<string[]>([]);
  const commandDropQuery = useCommandPaletteStore((state) => state.query);
  const openCommandDrop = useCommandPaletteStore((state) => state.open);
  const closeCommandDropState = useCommandPaletteStore((state) => state.close);
  const setCommandDropQuery = useCommandPaletteStore((state) => state.setQuery);
  const [recentCampaignIds, setRecentCampaignIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("library:recent-campaign-ids");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is string => typeof id === "string").slice(0, 10);
    } catch {
      return [];
    }
  });
  const [showAssignToast, setShowAssignToast] = useState(false);
  const [showAssignErrorToast, setShowAssignErrorToast] = useState(false);
  const [lastAssignResult, setLastAssignResult] = useState<AssignResult>({
    added: 0,
    skipped: 0,
    campaignName: "",
  });
  const { t } = useTranslation();
  const { files: workspaceFiles } = useWorkspaceLibrary();

  const fetchStats = useCallback(async () => {
    await Promise.resolve();
    setStatsLoading(true);
    try {
      const r = await fetch("/api/stats/overview");
      const data = (await r.json()) as DashboardOverviewStats;
      setStats(data);
    } catch (e) {
      console.error("Dashboard stats fetch error:", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- マウント時 GET（fetchStats は async）
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) =>
        setCampaigns(
          (data as Array<{ id: string; name: string }>).map((campaign) => ({
            id: campaign.id,
            name: campaign.name,
          }))
        )
      )
      .catch((e) => console.error("Failed to fetch campaigns:", e));
  }, []);

  const commandDropResults = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(commandDropQuery.trim().toLowerCase())
  );

  const openQuickAssign = useCallback(() => {
    const ids = workspaceFiles
      .filter((file) => file.linkedCampaigns.length === 0)
      .map((file) => file.id);
    setUnassignedFileIds(ids);
    if (ids.length === 0) return;
    setCommandDropQuery("");
    openCommandDrop();
  }, [workspaceFiles, openCommandDrop, setCommandDropQuery]);

  const closeCommandDrop = useCallback(() => {
    closeCommandDropState();
    setCommandDropQuery("");
  }, [closeCommandDropState, setCommandDropQuery]);

  const assignFromCommandDrop = useCallback((campaignId: string) => {
    const selectedCampaign = campaigns.find((campaign) => campaign.id === campaignId);
    if (!selectedCampaign || unassignedFileIds.length === 0) return;
    fetch("/api/files/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileIds: unassignedFileIds,
        campaignId,
      }),
    })
      .then(() => {
        setLastAssignResult({
          added: unassignedFileIds.length,
          skipped: 0,
          campaignName: selectedCampaign.name,
        });
        setShowAssignToast(true);
        window.setTimeout(() => setShowAssignToast(false), 5000);
        fetchStats();
        const nextRecent = [campaignId, ...recentCampaignIds.filter((id) => id !== campaignId)].slice(0, 10);
        setRecentCampaignIds(nextRecent);
        window.localStorage.setItem("library:recent-campaign-ids", JSON.stringify(nextRecent));
      })
      .catch((e) => {
        console.error("Failed to assign files:", e);
        setShowAssignErrorToast(true);
        window.setTimeout(() => setShowAssignErrorToast(false), 5000);
      })
      .finally(() => closeCommandDrop());
  }, [campaigns, unassignedFileIds, fetchStats, recentCampaignIds, closeCommandDrop]);

  useRegisterCommandPaletteSource({
    selectedCount: unassignedFileIds.length,
    campaigns: commandDropResults,
    recentCampaignIds,
    labels: {
      title: t.library.commandDropTitle,
      subtitle: t.library.commandDropSubtitle,
      placeholder: t.library.commandDropPlaceholder,
      empty: t.library.commandDropEmpty,
      shortcutsHint: t.library.commandDropShortcutsHint,
      shortcutsTitle: t.library.commandDropShortcutsTitle,
      shortcutMove: t.library.commandDropShortcutMove,
      shortcutSelect: t.library.commandDropShortcutSelect,
      shortcutClose: t.library.commandDropShortcutClose,
      shortcutToggleHelp: t.library.commandDropShortcutToggleHelp,
      recentBadge: t.library.commandDropRecentBadge,
    },
    onAssign: assignFromCommandDrop,
    onOpenRequest: openQuickAssign,
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <DashboardHeader title={t.dashboard.title} buttonText={t.dashboard.newCampaign} />

      <NextBestActions
        unassignedAssets={stats?.unassignedAssets ?? 0}
        onQuickAssign={openQuickAssign}
        t={t}
      />

      <DashboardStatsCompact stats={stats} loading={statsLoading} />

      <div className="hidden md:block">
        <BentoGrid>
          <StatCards stats={stats} loading={statsLoading} t={t} />
          <InsightCards stats={stats} t={t} />
        </BentoGrid>
      </div>

      <div className="md:hidden">
        <CollapsibleCallout title={t.dashboard.roiProof} tone="neutral">
          <InsightCards stats={stats} t={t} />
        </CollapsibleCallout>
      </div>

      <LibraryToasts
        showUndoToast={showAssignToast}
        showAssignErrorToast={showAssignErrorToast}
        lastAssignResult={lastAssignResult}
        hasUndoSnapshot={false}
        onUndo={() => {}}
        labels={{
          assignComplete: t.library.assignComplete,
          assignTarget: t.library.assignTarget,
          assignAdded: t.library.assignAdded,
          assignSkipped: t.library.assignSkipped,
          undo: t.library.undo,
          assignRestoreErrorTitle: t.library.assignRestoreErrorTitle,
          assignRestoreErrorBody: t.library.assignRestoreErrorBody,
        }}
      />
    </div>
  );
}
