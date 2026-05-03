"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import type { Campaign, QuickFilter, ViewMode } from "@/components/features/campaigns/types";

const STATUS_ORDER: Campaign["status"][] = ["draft", "active", "completed"];

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [peekCampaign, setPeekCampaign] = useState<Campaign | null>(null);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<string>>(new Set());
  const [focusedCampaignId, setFocusedCampaignId] = useState<string | null>(null);
  const [lastSelectedCampaignId, setLastSelectedCampaignId] = useState<string | null>(null);
  const [rangeHighlightedIds, setRangeHighlightedIds] = useState<Set<string>>(new Set());
  const [bulkUndo, setBulkUndo] = useState<{
    previousStatuses: Record<string, Campaign["status"]>;
    nextStatus: Campaign["status"];
  } | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { t, locale } = useTranslation();

  const fetchCampaigns = useCallback(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(data))
      .catch((e) => console.error("Failed to fetch campaigns:", e));
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const formatDate = useCallback((value: string) =>
    new Date(value).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US"),
    [locale]
  );

  const getEstimatedDeadline = useCallback((campaign: Campaign) => {
    const deadline = new Date(campaign.createdAt);
    deadline.setDate(deadline.getDate() + 14);
    return deadline;
  }, []);

  const isNeedsAttention = useCallback((campaign: Campaign) =>
    campaign.status === "active" && campaign.stats.openRate < 30,
    []
  );

  const isDueSoon = useCallback((campaign: Campaign) => {
    if (campaign.status === "completed") return false;
    const now = new Date();
    const due = getEstimatedDeadline(campaign);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }, [getEstimatedDeadline]);

  const visibleCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const query = searchQuery.toLowerCase();
      const byName = campaign.name.toLowerCase().includes(query);
      const byTag = campaign.tags.some((tag) => tag.toLowerCase().includes(query));
      
      if (!byName && !byTag) return false;

      // New: Tag selection filter
      if (selectedTag && !campaign.tags.includes(selectedTag)) return false;

      if (activeFilter === "all") return true;
      if (activeFilter === "needsAttention") return isNeedsAttention(campaign);
      if (activeFilter === "dueSoon") return isDueSoon(campaign);
      return campaign.status === activeFilter;
    });
  }, [campaigns, searchQuery, activeFilter, isNeedsAttention, isDueSoon, selectedTag]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    campaigns.forEach((c) => c.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [campaigns]);

  const orderedVisibleCampaigns = useMemo(() => {
    return [...visibleCampaigns].sort((a, b) => {
      const aNeedsAttention = isNeedsAttention(a);
      const bNeedsAttention = isNeedsAttention(b);
      if (aNeedsAttention !== bNeedsAttention) return aNeedsAttention ? -1 : 1;

      const aDueSoon = isDueSoon(a);
      const bDueSoon = isDueSoon(b);
      if (aDueSoon !== bDueSoon) return aDueSoon ? -1 : 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [visibleCampaigns, isNeedsAttention, isDueSoon]);

  const groupedCampaigns = useMemo(() => {
    return STATUS_ORDER.reduce<Record<Campaign["status"], Campaign[]>>(
      (acc, status) => {
        acc[status] = orderedVisibleCampaigns
          .filter((campaign) => campaign.status === status)
          .sort((a, b) => {
            const aNeedsAttention = isNeedsAttention(a);
            const bNeedsAttention = isNeedsAttention(b);
            if (aNeedsAttention !== bNeedsAttention) return aNeedsAttention ? -1 : 1;

            const aDueSoon = isDueSoon(a);
            const bDueSoon = isDueSoon(b);
            if (aDueSoon !== bDueSoon) return aDueSoon ? -1 : 1;

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        return acc;
      },
      { draft: [], active: [], completed: [] }
    );
  }, [orderedVisibleCampaigns, isNeedsAttention, isDueSoon]);

  const selectCampaignWithRange = useCallback((campaignId: string, useRange: boolean) => {
    const highlightedInThisAction: string[] = [];
    setSelectedCampaignIds((prev) => {
      const next = new Set(prev);
      const shouldSelect = !next.has(campaignId);
      if (!useRange || !lastSelectedCampaignId) {
        if (shouldSelect) next.add(campaignId);
        else next.delete(campaignId);
        return next;
      }

      const startIndex = orderedVisibleCampaigns.findIndex((campaign) => campaign.id === lastSelectedCampaignId);
      const endIndex = orderedVisibleCampaigns.findIndex((campaign) => campaign.id === campaignId);
      if (startIndex < 0 || endIndex < 0) {
        if (shouldSelect) next.add(campaignId);
        else next.delete(campaignId);
        return next;
      }
      const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      for (let i = from; i <= to; i += 1) {
        const id = orderedVisibleCampaigns[i]?.id;
        if (!id) continue;
        highlightedInThisAction.push(id);
        if (shouldSelect) next.add(id);
        else next.delete(id);
      }
      return next;
    });
    if (useRange && highlightedInThisAction.length > 0) {
      setRangeHighlightedIds(new Set(highlightedInThisAction));
    } else {
      setRangeHighlightedIds(new Set());
    }
    setLastSelectedCampaignId(campaignId);
  }, [lastSelectedCampaignId, orderedVisibleCampaigns]);

  const applyBulkStatus = useCallback(
    async (status: Campaign["status"]) => {
      const ids = Array.from(selectedCampaignIds);
      if (ids.length === 0) return;

      const previousStatuses: Record<string, Campaign["status"]> = {};
      campaigns.forEach((c) => {
        if (selectedCampaignIds.has(c.id)) {
          previousStatuses[c.id] = c.status;
        }
      });

      try {
        const res = await fetch("/api/campaigns/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, status }),
        });
        if (!res.ok) {
          throw new Error(`bulk status ${res.status}`);
        }
        const data = (await res.json()) as { campaigns: Campaign[] };
        setCampaigns(data.campaigns);
        setBulkUndo({ previousStatuses, nextStatus: status });
        setSelectedCampaignIds(new Set());
      } catch (e) {
        console.error(e);
      }
    },
    [campaigns, selectedCampaignIds]
  );

  const undoBulkStatus = useCallback(() => {
    if (!bulkUndo) return;
    setCampaigns((prev) =>
      prev.map((campaign) =>
        bulkUndo.previousStatuses[campaign.id]
          ? { ...campaign, status: bulkUndo.previousStatuses[campaign.id] }
          : campaign
      )
    );
    setBulkUndo(null);
  }, [bulkUndo]);

  const effectiveFocusedCampaignId = useMemo(() => {
    return focusedCampaignId && orderedVisibleCampaigns.some((campaign) => campaign.id === focusedCampaignId)
      ? focusedCampaignId
      : orderedVisibleCampaigns[0]?.id ?? null;
  }, [focusedCampaignId, orderedVisibleCampaigns]);

  useEffect(() => {
    if (!bulkUndo) return;
    const timer = window.setTimeout(() => setBulkUndo(null), 5000);
    return () => window.clearTimeout(timer);
  }, [bulkUndo]);

  useEffect(() => {
    if (rangeHighlightedIds.size === 0) return;
    const timer = window.setTimeout(() => setRangeHighlightedIds(new Set()), 900);
    return () => window.clearTimeout(timer);
  }, [rangeHighlightedIds]);

  const selectAll = useCallback(() => {
    const visibleIds = orderedVisibleCampaigns.map((campaign) => campaign.id);
    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedCampaignIds.has(id));
    if (allSelected) {
      setSelectedCampaignIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedCampaignIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [orderedVisibleCampaigns, selectedCampaignIds]);

  return {
    campaigns,
    visibleCampaigns,
    orderedVisibleCampaigns,
    groupedCampaigns,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    viewMode,
    setViewMode,
    peekCampaign,
    setPeekCampaign,
    selectedCampaignIds,
    setSelectedCampaignIds,
    focusedCampaignId,
    setFocusedCampaignId,
    effectiveFocusedCampaignId,
    rangeHighlightedIds,
    bulkUndo,
    applyBulkStatus,
    undoBulkStatus,
    selectCampaignWithRange,
    selectAll,
    formatDate,
    isNeedsAttention,
    isDueSoon,
    allTags,
    selectedTag,
    setSelectedTag,
    t,
  };
}
