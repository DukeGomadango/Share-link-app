"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { CampaignSummary } from "@/components/features/library/types";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";

export function useLibraryCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [campaignQuery, setCampaignQuery] = useState("");
  const [commandDropOpenedAtTs, setCommandDropOpenedAtTs] = useState(() => Date.now());
  const commandDropQuery = useCommandPaletteStore((state) => state.query);

  const [recentCampaignIds, setRecentCampaignIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("library:recent-campaign-ids");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
      return [];
    }
  });

  const [recentCampaignTouchedAtById, setRecentCampaignTouchedAtById] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem("library:recent-campaign-touched-at");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};
      const entries = Object.entries(parsed).filter(
        ([key, value]) => typeof key === "string" && typeof value === "number"
      );
      return Object.fromEntries(entries) as Record<string, number>;
    } catch {
      return {};
    }
  });

  const fetchCampaigns = useCallback(() => {
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

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    window.localStorage.setItem("library:recent-campaign-ids", JSON.stringify(recentCampaignIds));
  }, [recentCampaignIds]);

  useEffect(() => {
    window.localStorage.setItem(
      "library:recent-campaign-touched-at",
      JSON.stringify(recentCampaignTouchedAtById)
    );
  }, [recentCampaignTouchedAtById]);

  const rememberRecentCampaign = useCallback((campaignId: string) => {
    const touchedAt = Date.now();
    setRecentCampaignIds((prev) => [campaignId, ...prev.filter((id) => id !== campaignId)].slice(0, 10));
    setRecentCampaignTouchedAtById((prev) => ({ ...prev, [campaignId]: touchedAt }));
  }, []);

  const filteredCampaigns = useMemo(() => {
    const normalizedQuery = campaignQuery.trim().toLowerCase();
    if (!normalizedQuery) return campaigns;
    return campaigns.filter((campaign) => campaign.name.toLowerCase().includes(normalizedQuery));
  }, [campaigns, campaignQuery]);

  const commandDropResults = useMemo(() => {
    const normalizedQuery = commandDropQuery.trim().toLowerCase();
    const recentSet = new Set(recentCampaignIds);

    const scored = campaigns
      .filter((campaign) => {
        if (!normalizedQuery) return true;
        return campaign.name.toLowerCase().includes(normalizedQuery);
      })
      .map((campaign) => {
        const lowerName = campaign.name.toLowerCase();
        const touchedAt = recentCampaignTouchedAtById[campaign.id];
        const ageHours =
          typeof touchedAt === "number" ? (commandDropOpenedAtTs - touchedAt) / (1000 * 60 * 60) : null;
        const recencyScore =
          ageHours === null
            ? 0
            : recentSet.has(campaign.id)
            ? 1200 * Math.exp(-ageHours / 24)
            : 0;
        const isStartsWith = normalizedQuery ? lowerName.startsWith(normalizedQuery) : false;
        return {
          campaign,
          score: recencyScore + (isStartsWith ? 200 : 0),
        };
      })
      .sort((a, b) => b.score - a.score || a.campaign.name.localeCompare(b.campaign.name));

    return scored.map((item) => item.campaign);
  }, [campaigns, commandDropQuery, recentCampaignIds, recentCampaignTouchedAtById, commandDropOpenedAtTs]);

  const recentCampaigns = useMemo(() => {
    const byId = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
    return recentCampaignIds.map((id) => byId.get(id)).filter((c): c is CampaignSummary => !!c).slice(0, 5);
  }, [campaigns, recentCampaignIds]);

  return {
    campaigns,
    campaignQuery,
    setCampaignQuery,
    recentCampaignIds,
    commandDropResults,
    recentCampaigns,
    filteredCampaigns,
    rememberRecentCampaign,
    setCommandDropOpenedAtTs,
  };
}
