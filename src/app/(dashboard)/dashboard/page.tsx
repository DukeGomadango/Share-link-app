"use client";

import { useCallback, useEffect, useState } from "react";
import { BentoGrid, BentoItem } from "@/components/shared/BentoGrid";
import {
  AlertTriangle,
  ArrowRight,
  Gift,
  MousePointerClick,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import type { DashboardOverviewStats } from "@/lib/stats/overview";
import { LibraryToasts } from "@/components/features/library/LibraryToasts";
import type { AssignResult, CampaignSummary } from "@/components/features/library/types";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";
import { useRegisterCommandPaletteSource } from "@/hooks/features/library/useRegisterCommandPaletteSource";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardOverviewStats | null>(null);
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

  const fetchStats = useCallback(() => {
    fetch("/api/stats/overview")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch((e) => console.error("Mock API fetch error:", e));
  }, []);

  useEffect(() => {
    fetchStats();
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

  const weeklyViews = stats?.weeklyViews ?? null;
  const hasLowOpenRate = stats?.anomalies.lowOpenRate ?? false;
  const hasNoActiveCampaign = stats?.anomalies.noActiveCampaigns ?? false;
  const anomalyCount = Number(hasLowOpenRate) + Number(hasNoActiveCampaign);
  const anomalyToneClass =
    anomalyCount > 0
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-emerald-500/10 border-emerald-500/20";

  const commandDropResults = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(commandDropQuery.trim().toLowerCase())
  );

  const openQuickAssign = useCallback(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((files) => {
        const ids = (files as Array<{ id: string; linkedCampaigns: string[] }>)
          .filter((file) => file.linkedCampaigns.length === 0)
          .map((file) => file.id);
        setUnassignedFileIds(ids);
        if (ids.length === 0) return;
        setCommandDropQuery("");
        openCommandDrop();
      })
      .catch((e) => console.error("Failed to fetch files:", e));
  }, [openCommandDrop, setCommandDropQuery]);

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
        campaignName: selectedCampaign.name,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h1>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
          <Gift className="w-4 h-4 mr-2" />
          {t.dashboard.newCampaign}
        </Button>
      </div>

      <BentoGrid>
        <BentoItem colSpan={2} className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.todayFocus}</p>
              <h2 className="text-2xl font-bold mt-1">{t.dashboard.nextBestActionsTitle}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t.dashboard.nextBestActionsDescription}</p>
              {stats && (
                <p className="text-xs mt-2 text-muted-foreground">
                  {t.dashboard.unassignedAssetsHint.replace("{count}", String(stats.unassignedAssets))}
                </p>
              )}
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
              disabled={(stats?.unassignedAssets ?? 0) === 0}
              onClick={openQuickAssign}
            >
              {t.dashboard.actionAssignUnassigned}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </BentoItem>

        <BentoItem colSpan={1} className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-full">
              <Gift className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.activeCampaigns}</p>
              <h2 className="text-3xl font-bold">{stats?.activeCampaigns ?? "-"}</h2>
            </div>
          </div>
        </BentoItem>

        <BentoItem colSpan={1}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.totalDistributed}</p>
              <h2 className="text-3xl font-bold">{stats?.totalDistributed ?? "-"}</h2>
            </div>
          </div>
        </BentoItem>

        <BentoItem colSpan={1} className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-full">
              <MousePointerClick className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.openRate}</p>
              <h2 className="text-3xl font-bold">
                {stats ? `${stats.openRate}%` : "-"}
              </h2>
            </div>
          </div>
        </BentoItem>

        <BentoItem colSpan={2} className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.roiProof}</p>
              <h3 className="text-lg font-semibold mt-1">{t.dashboard.roiHeadline}</h3>
              <p className="text-sm mt-2 text-muted-foreground">
                {stats
                  ? t.dashboard.roiMessage
                      .replace("{count}", String(weeklyViews ?? 0))
                      .replace("{openRate}", String(stats.openRate))
                  : t.common.loading}
              </p>
              {stats && (
                <p className="text-xs mt-2 text-emerald-500">
                  {t.dashboard.weeklyGrowth.replace("{value}", String(stats.weekOverWeekGrowth))}
                </p>
              )}
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-full shrink-0">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4">
            <Button asChild variant="outline" className="justify-between">
              <Link href="/campaigns">
                {t.dashboard.viewTopCampaigns}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </BentoItem>

        <BentoItem colSpan={1} className={anomalyToneClass}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.dashboard.anomalyWatch}</p>
              <h3 className="text-lg font-semibold mt-1">
                {anomalyCount > 0 ? t.dashboard.needsAttention : t.dashboard.healthyStatus}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <p className="text-sm mt-3 text-muted-foreground">
            {hasLowOpenRate
              ? t.dashboard.lowOpenRateMessage.replace("{openRate}", String(stats?.openRate ?? 0))
              : t.dashboard.noAnomalyMessage}
          </p>
          <div className="mt-4 space-y-2">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/campaigns">
                {hasLowOpenRate ? t.dashboard.actionReviewCampaigns : t.dashboard.actionOpenCampaigns}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            {hasNoActiveCampaign && (
              <Button asChild className="w-full justify-between">
                <Link href="/campaigns/new">
                  {t.dashboard.actionLaunchFirstCampaign}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </BentoItem>
      </BentoGrid>

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
