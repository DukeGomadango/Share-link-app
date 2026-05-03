"use client";

import { useEffect } from "react";
import { useCampaigns } from "@/hooks/features/campaigns/useCampaigns";
import { CampaignsHeader } from "@/components/features/campaigns/CampaignsHeader";
import { CampaignsFilters } from "@/components/features/campaigns/CampaignsFilters";
import { CampaignsListView } from "@/components/features/campaigns/CampaignsListView";
import { CampaignsKanbanView } from "@/components/features/campaigns/CampaignsKanbanView";
import { CampaignPeekDrawer } from "@/components/features/campaigns/CampaignPeekDrawer";
import { CampaignBulkActions } from "@/components/features/campaigns/CampaignBulkActions";
import { CampaignUndoToast } from "@/components/features/campaigns/CampaignUndoToast";
import { EmptyCampaignState } from "@/components/features/campaigns/EmptyCampaignState";
import type { QuickFilter } from "@/components/features/campaigns/types";

const QUICK_FILTERS: QuickFilter[] = [
  "all",
  "needsAttention",
  "dueSoon",
  "active",
  "draft",
  "completed",
];

export default function CampaignsPage() {
  const {
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
    effectiveFocusedCampaignId,
    setFocusedCampaignId,
    rangeHighlightedIds,
    bulkUndo,
    applyBulkStatus,
    undoBulkStatus,
    selectCampaignWithRange,
    selectAll,
    formatDate,
    isDueSoon,
    allTags,
    selectedTag,
    setSelectedTag,
  } = useCampaigns();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingField =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;
      if (isTypingField) return;

      if (event.key === "Escape") {
        if (peekCampaign) {
          event.preventDefault();
          setPeekCampaign(null);
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        selectAll();
        return;
      }

      if (!effectiveFocusedCampaignId || orderedVisibleCampaigns.length === 0) return;

      const currentIndex = orderedVisibleCampaigns.findIndex(
        (campaign) => campaign.id === effectiveFocusedCampaignId
      );
      if (currentIndex < 0) return;

      if (event.key === "Enter") {
        event.preventDefault();
        setPeekCampaign(orderedVisibleCampaigns[currentIndex]);
        return;
      }

      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;

      event.preventDefault();
      const move = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
      const nextIndex = Math.min(
        orderedVisibleCampaigns.length - 1,
        Math.max(0, currentIndex + move)
      );
      const nextCampaign = orderedVisibleCampaigns[nextIndex];
      if (!nextCampaign) return;
      setFocusedCampaignId(nextCampaign.id);
      const targetCard = document.querySelector<HTMLElement>(`[data-campaign-id="${nextCampaign.id}"]`);
      targetCard?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [effectiveFocusedCampaignId, orderedVisibleCampaigns, peekCampaign, selectAll, setFocusedCampaignId, setPeekCampaign]);

  return (
    <div className="space-y-6 relative">
      <CampaignsHeader />

      {campaigns.length === 0 ? (
        <EmptyCampaignState />
      ) : (
        <>
          <CampaignsFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            quickFilters={QUICK_FILTERS}
            allTags={allTags}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
          />

          {viewMode === "list" ? (
            <CampaignsListView
              campaigns={visibleCampaigns}
              selectedCampaignIds={selectedCampaignIds}
              onSelect={selectCampaignWithRange}
              onPeek={setPeekCampaign}
              onFocus={setFocusedCampaignId}
              effectiveFocusedCampaignId={effectiveFocusedCampaignId}
              rangeHighlightedIds={rangeHighlightedIds}
              formatDate={formatDate}
              isNeedsAttention={isNeedsAttention}
              isDueSoon={isDueSoon}
            />
          ) : (
            <CampaignsKanbanView
              groupedCampaigns={groupedCampaigns}
              selectedCampaignIds={selectedCampaignIds}
              onSelect={selectCampaignWithRange}
              onPeek={setPeekCampaign}
              onFocus={setFocusedCampaignId}
              effectiveFocusedCampaignId={effectiveFocusedCampaignId}
              rangeHighlightedIds={rangeHighlightedIds}
              formatDate={formatDate}
              isNeedsAttention={isNeedsAttention}
              isDueSoon={isDueSoon}
            />
          )}
        </>
      )}

      <CampaignBulkActions
        selectedCount={selectedCampaignIds.size}
        onApplyStatus={applyBulkStatus}
        onClearSelection={() => setSelectedCampaignIds(new Set())}
      />

      <CampaignUndoToast bulkUndo={bulkUndo} onUndo={undoBulkStatus} />

      <CampaignPeekDrawer
        peekCampaign={peekCampaign}
        onClose={() => setPeekCampaign(null)}
        formatDate={formatDate}
        isNeedsAttention={isNeedsAttention}
        isDueSoon={isDueSoon}
      />
    </div>
  );
}
