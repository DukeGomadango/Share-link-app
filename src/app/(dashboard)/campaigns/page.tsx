"use client";

import { useState, useEffect, useMemo } from "react";
import { useIsLgUp } from "@/hooks/useBreakpoint";
import { CampaignsMobileToolbar } from "@/components/features/campaigns/CampaignsMobileToolbar";
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
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

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
    isNeedsAttention,
    isDueSoon,
    deleteCampaigns,
    allTags,
    selectedTag,
    setSelectedTag,
  } = useCampaigns();

  const { t } = useTranslation();
  const isLgUp = useIsLgUp();
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLgUp && viewMode === "kanban") {
      setViewMode("list");
    }
  }, [isLgUp, viewMode, setViewMode]);

  const campaignFilterProps = useMemo(
    () => ({
      searchQuery,
      onSearchChange: setSearchQuery,
      viewMode,
      onViewModeChange: setViewMode,
      activeFilter,
      onFilterChange: setActiveFilter,
      quickFilters: QUICK_FILTERS,
      allTags,
      selectedTag,
      onTagChange: setSelectedTag,
    }),
    [
      searchQuery,
      viewMode,
      activeFilter,
      allTags,
      selectedTag,
      setSearchQuery,
      setViewMode,
      setActiveFilter,
      setSelectedTag,
    ]
  );

  const activeFilterCount = [
    selectedTag,
    searchQuery.trim(),
    activeFilter !== "all",
  ].filter(Boolean).length;

  const effectiveViewMode = isLgUp ? viewMode : "list";

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

  const handleDelete = async () => {
    if (idsToDelete.length === 0) return;
    setIsDeleting(true);
    try {
      const success = await deleteCampaigns(idsToDelete);
      if (success) {
        toast.success(t.campaigns.deleteSuccess);
        setIdsToDelete([]);
      } else {
        toast.error(t.campaigns.deleteFailed);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <CampaignsHeader />

      {campaigns.length === 0 ? (
        <EmptyCampaignState />
      ) : (
        <>
          <CampaignsMobileToolbar
            {...campaignFilterProps}
            activeFilterCount={activeFilterCount}
            quickFilters={QUICK_FILTERS}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          <div className="hidden lg:block">
            <CampaignsFilters {...campaignFilterProps} />
          </div>

          {effectiveViewMode === "list" ? (
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
              onDelete={(id) => setIdsToDelete([id])}
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
              onDelete={(id) => setIdsToDelete([id])}
            />
          )}
        </>
      )}

      <CampaignBulkActions
        selectedCount={selectedCampaignIds.size}
        onApplyStatus={applyBulkStatus}
        onDelete={() => setIdsToDelete(Array.from(selectedCampaignIds))}
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

      <ConfirmModal
        isOpen={idsToDelete.length > 0}
        onClose={() => setIdsToDelete([])}
        onConfirm={handleDelete}
        title={t.campaigns.deleteConfirmTitle}
        description={t.campaigns.deleteConfirmDescription}
        confirmText={t.common.delete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
