"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Megaphone, MoreVertical, AlertTriangle, Clock3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { useTranslation } from "@/lib/i18n";

interface Campaign {
  id: string;
  name: string;
  status: "active" | "draft" | "completed";
  type: string;
  createdAt: string;
  stats: {
    totalFiles: number;
    assignedRecipients: number;
    openRate: number;
  };
}

type QuickFilter = "all" | "needsAttention" | "dueSoon" | Campaign["status"];
type ViewMode = "list" | "kanban";

const QUICK_FILTERS: QuickFilter[] = [
  "all",
  "needsAttention",
  "dueSoon",
  "active",
  "draft",
  "completed",
];

const STATUS_ORDER: Campaign["status"][] = ["draft", "active", "completed"];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [peekCampaign, setPeekCampaign] = useState<Campaign | null>(null);
  const { t, locale } = useTranslation();

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(data))
      .catch((e) => console.error("Failed to fetch campaigns:", e));
  }, []);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US");

  const getEstimatedDeadline = (campaign: Campaign) => {
    const deadline = new Date(campaign.createdAt);
    deadline.setDate(deadline.getDate() + 14);
    return deadline;
  };

  const isNeedsAttention = (campaign: Campaign) =>
    campaign.status === "active" && campaign.stats.openRate < 30;

  const isDueSoon = (campaign: Campaign) => {
    if (campaign.status === "completed") return false;
    const now = new Date();
    const due = getEstimatedDeadline(campaign);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  const visibleCampaigns = campaigns.filter((campaign) => {
    const bySearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!bySearch) return false;
    if (activeFilter === "all") return true;
    if (activeFilter === "needsAttention") return isNeedsAttention(campaign);
    if (activeFilter === "dueSoon") return isDueSoon(campaign);
    return campaign.status === activeFilter;
  });

  const getStatusPillClass = (status: Campaign["status"]) => {
    if (status === "active") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (status === "completed") return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    return "bg-muted text-muted-foreground border-border";
  };

  const groupedCampaigns = STATUS_ORDER.reduce<Record<Campaign["status"], Campaign[]>>(
    (acc, status) => {
      acc[status] = visibleCampaigns
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

  return (
    <div className="space-y-6 relative">
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

      {campaigns.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t.campaigns.noCampaignsTitle}</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {t.campaigns.noCampaignsDescription}
          </p>
          <Button asChild className="bg-emerald-500">
            <Link href="/campaigns/new">{t.campaigns.createCampaign}</Link>
          </Button>
        </GlassCard>
      ) : (
        <>
          <GlassCard className="p-4 md:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full flex-col gap-2 lg:max-w-xl">
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t.campaigns.searchPlaceholder}
                  className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                />
                <div className="inline-flex w-fit rounded-lg border border-border bg-background/40 p-1">
                  <Button
                    size="sm"
                    variant={viewMode === "list" ? "default" : "ghost"}
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""}
                  >
                    {t.campaigns.views.list}
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === "kanban" ? "default" : "ghost"}
                    onClick={() => setViewMode("kanban")}
                    className={viewMode === "kanban" ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""}
                  >
                    {t.campaigns.views.kanban}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_FILTERS.map((filterKey) => (
                  <Button
                    key={filterKey}
                    variant={activeFilter === filterKey ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filterKey)}
                    className={
                      activeFilter === filterKey
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : ""
                    }
                  >
                    {t.campaigns.quickFilters[filterKey]}
                  </Button>
                ))}
              </div>
            </div>
          </GlassCard>

          {viewMode === "list" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {visibleCampaigns.map((campaign) => (
                <GlassCard
                  key={campaign.id}
                  className="relative group hover:border-emerald-500/50 transition-colors cursor-pointer"
                  onClick={() => setPeekCampaign(campaign)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-md ${
                          campaign.status === "active"
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{campaign.name}</h3>
                        <p className="text-xs text-muted-foreground">{formatDate(campaign.createdAt)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs ${getStatusPillClass(campaign.status)}`}>
                      {t.campaigns.status[campaign.status]}
                    </span>
                    {isNeedsAttention(campaign) && (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
                        {t.campaigns.quickFilters.needsAttention}
                      </span>
                    )}
                    {isDueSoon(campaign) && (
                      <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs text-purple-300">
                        {t.campaigns.quickFilters.dueSoon}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{t.campaigns.files}</p>
                      <p className="font-semibold">{campaign.stats.totalFiles}</p>
                    </div>
                    <div className="text-center border-x border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">{t.campaigns.assigned}</p>
                      <p className="font-semibold">{campaign.stats.assignedRecipients}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">{t.campaigns.openRate}</p>
                      <p className="font-semibold">{campaign.stats.openRate}%</p>
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full glass group-hover:bg-emerald-500 group-hover:text-white hover:bg-emerald-600 hover:text-white transition-colors border-border/50"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Link href={`/campaigns/${campaign.id}`}>{t.common.manage}</Link>
                  </Button>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {STATUS_ORDER.map((status) => (
                <GlassCard key={status} className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-full border px-2.5 py-1 text-xs ${getStatusPillClass(status)}`}>
                      {t.campaigns.status[status]}
                    </span>
                    <span className="text-xs text-muted-foreground">{groupedCampaigns[status].length}</span>
                  </div>
                  <div className="space-y-3">
                    {groupedCampaigns[status].map((campaign) => (
                      <div
                        key={campaign.id}
                        className="rounded-lg border border-border/70 bg-background/50 p-3 cursor-pointer hover:border-emerald-500/50 transition-colors"
                        onClick={() => setPeekCampaign(campaign)}
                      >
                        <p className="text-sm font-medium line-clamp-1">{campaign.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(campaign.createdAt)}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {isNeedsAttention(campaign) && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
                              {t.campaigns.quickFilters.needsAttention}
                            </span>
                          )}
                          {isDueSoon(campaign) && (
                            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
                              {t.campaigns.quickFilters.dueSoon}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span>{t.campaigns.files}: {campaign.stats.totalFiles}</span>
                          <span>{t.campaigns.openRate}: {campaign.stats.openRate}%</span>
                        </div>
                      </div>
                    ))}
                    {groupedCampaigns[status].length === 0 && (
                      <div className="rounded-lg border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
                        {t.campaigns.emptyColumn}
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${peekCampaign ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setPeekCampaign(null)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-background/95 p-6 backdrop-blur transition-transform duration-300 ${peekCampaign ? "translate-x-0" : "translate-x-full"}`}
      >
        {peekCampaign && (
          <div className="flex h-full flex-col">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t.campaigns.peek.title}
                </p>
                <h2 className="text-xl font-semibold">{peekCampaign.name}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPeekCampaign(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <GlassCard className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{t.campaigns.peek.createdAt}</p>
                <p className="font-medium">{formatDate(peekCampaign.createdAt)}</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{t.campaigns.peek.type}</p>
                <p className="font-medium uppercase">{peekCampaign.type}</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-xs text-muted-foreground mb-2">{t.campaigns.peek.recipients}</p>
                <p className="font-medium">{peekCampaign.stats.assignedRecipients}</p>
              </GlassCard>
              {isNeedsAttention(peekCampaign) && (
                <GlassCard className="p-4 border-amber-500/40">
                  <div className="flex items-center gap-2 text-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    <p className="text-sm">{t.campaigns.quickFilters.needsAttention}</p>
                  </div>
                </GlassCard>
              )}
              {isDueSoon(peekCampaign) && (
                <GlassCard className="p-4 border-purple-500/40">
                  <div className="flex items-center gap-2 text-purple-300">
                    <Clock3 className="w-4 h-4" />
                    <p className="text-sm">{t.campaigns.quickFilters.dueSoon}</p>
                  </div>
                </GlassCard>
              )}
            </div>

            <div className="mt-auto pt-6 space-y-2">
              <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                <Link href={`/campaigns/${peekCampaign.id}`}>{t.common.manage}</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPeekCampaign(null)}
              >
                {t.campaigns.peek.close}
              </Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
