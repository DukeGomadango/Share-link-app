"use client";

import { useState } from "react";
import { FileImage, FileAudio, File as FileIcon, Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AssetPreviewModal } from "@/components/features/library/AssetPreviewModal";
import { AssetAssignModal } from "@/components/features/library/AssetAssignModal";
import { AssetFile } from "@/components/features/library/types";
import { useLibrary } from "@/hooks/features/library/useLibrary";
import { useRegisterCommandPaletteSource } from "@/hooks/features/library/useRegisterCommandPaletteSource";
import { toast } from "sonner";

// サブコンポーネント
import { LibraryHeader } from "@/components/features/library/LibraryHeader";
import { LibraryFilters } from "@/components/features/library/LibraryFilters";
import { LibraryGrid } from "@/components/features/library/LibraryGrid";
import { LibraryToasts } from "@/components/features/library/LibraryToasts";
import { LibraryRetentionBanner } from "@/components/features/library/LibraryRetentionBanner";

export default function LibraryPage() {
  const { t, locale } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<AssetFile | null>(null);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  const {
    files,
    campaigns,
    fileTypeFilter,
    setFileTypeFilter,
    searchQuery,
    setSearchQuery,
    unassignedOnly,
    setUnassignedOnly,
    sizeFilter,
    setSizeFilter,
    dateFilter,
    setDateFilter,
    selectedTag,
    setSelectedTag,
    smartTags,
    selectedFileIds,
    setSelectedFileIds,
    toggleSelection,
    isAssignModalOpen,
    setIsAssignModalOpen,
    assignTargetCampaignId,
    setAssignTargetCampaignId,
    campaignQuery,
    setCampaignQuery,
    lastAssignResult,
    draggedFileIds,
    assigningCampaignIds,
    pulsedCampaignId,
    showUndoToast,
    showAssignErrorToast,
    undoSnapshot,
    filteredFiles,
    selectedCount,
    unassignedCount,
    expiringSoonCount,
    filteredCampaigns,
    recentCampaigns,
    commandDropResults,
    recentCampaignIds,
    sensors,
    handleFilesDropped,
    handleRename,
    handleDelete,
    handleBulkDelete,
    filesLoading,
    filesLoadingMore,
    hasMoreFiles,
    loadMoreFiles,
    assetCounts,
    handleUndoAssign,
    handleDragStart,
    handleDragEnd,
    assignSelectedToCampaign,
    openCommandDropForSelection,
    assignFromCommandDrop,
  } = useLibrary();

  const selectedFiles = filteredFiles.filter(f => selectedFileIds.has(f.id));
  const linkedSelectedCount = selectedFiles.filter(f => f.linkedCampaigns.length > 0).length;
  const [viewMode, setViewMode] = useState<"detail" | "compact">("detail");
  const [isBulkRemoving, setIsBulkRemoving] = useState(false);

  const onBulkRemove = async () => {
    setIsBulkRemoving(true);
    try {
      await handleBulkDelete(Array.from(selectedFileIds));
      setIsBulkConfirmOpen(false);
      setSelectedFileIds(new Set());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "一括削除に失敗しました。");
    } finally {
      setIsBulkRemoving(false);
    }
  };

  useRegisterCommandPaletteSource({
    selectedCount,
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
    onOpenRequest: openCommandDropForSelection,
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (type.startsWith("audio/")) return <FileAudio className="w-8 h-8 text-purple-500" />;
    return <FileIcon className="w-8 h-8 text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const openAssignModalForFile = (fileId: string) => {
    setSelectedFileIds(new Set([fileId]));
    setAssignTargetCampaignId(campaigns[0]?.id ?? "");
    setCampaignQuery("");
    setIsAssignModalOpen(true);
  };

  const isIntentDockOpen = draggedFileIds.length > 0;

  return (
    <div className={`space-y-6 ${isIntentDockOpen ? "pb-36" : "pb-20"}`}>
      <LibraryHeader title={t.library.title} subtitle={t.library.subtitle} />

      <LibraryRetentionBanner
        expiringSoonCount={expiringSoonCount}
        totalFiles={assetCounts.total > 0 ? assetCounts.total : files.length}
      />

      <div className="mb-8 space-y-4">
        <FileDropzone onFilesDropped={handleFilesDropped} />
      </div>

      <LibraryFilters
        fileTypeFilter={fileTypeFilter}
        onFileTypeFilterChange={setFileTypeFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        unassignedOnly={unassignedOnly}
        onUnassignedOnlyChange={setUnassignedOnly}
        sizeFilter={sizeFilter}
        onSizeFilterChange={setSizeFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        selectedTag={selectedTag}
        smartTags={smartTags}
        onSelectedTagChange={setSelectedTag}
        selectedCount={selectedCount}
        campaignsCount={campaigns.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onClearSelection={() => setSelectedFileIds(new Set())}
        onOpenCommandDrop={openCommandDropForSelection}
        onOpenAssignModal={() => {
          setAssignTargetCampaignId(campaigns[0]?.id ?? "");
          setCampaignQuery("");
          setIsAssignModalOpen(true);
        }}
        onBulkDelete={() => setIsBulkConfirmOpen(true)}
        labels={{
          searchPlaceholder: t.library.searchAssetsPlaceholder,
          filtersLabel: t.library.filtersLabel,
          unassignedOnly: t.library.unassignedOnly,
          sizeLabel: t.library.sizeLabel,
          dateLabel: t.library.dateLabel,
          tagLabel: t.library.tagLabel,
          viewModeDetail: t.library.viewModeDetail,
          viewModeCompact: t.library.viewModeCompact,
          dateOptions: t.library.dateOptions,
          sizeOptions: t.library.sizeOptions,
          fileType: t.library.fileType,
          openCommandDrop: t.library.openCommandDrop,
          clearSelection: t.library.clearSelection,
          assignToCampaign: t.library.assignToCampaign,
          deleteSelected: "ライブラリから削除",
        }}
      />

      <LibraryGrid
        loading={filesLoading}
        loadingMore={filesLoadingMore}
        hasMore={hasMoreFiles}
        onLoadMore={loadMoreFiles}
        files={files}
        filteredFiles={filteredFiles}
        campaigns={campaigns}
        recentCampaigns={recentCampaigns}
        selectedFileIds={selectedFileIds}
        draggedFileIds={draggedFileIds}
        assigningCampaignIds={assigningCampaignIds}
        pulsedCampaignId={pulsedCampaignId}
        unassignedCount={unassignedCount}
        locale={locale}
        sensors={sensors}
        viewMode={viewMode}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onToggleSelection={toggleSelection}
        onPreview={setSelectedFile}
        onOpenAssign={openAssignModalForFile}
        onRename={handleRename}
        onRemove={handleDelete}
        onRequestBulkRemove={() => setIsBulkConfirmOpen(true)}
        onSelectMultiple={(ids) => setSelectedFileIds(new Set(ids))}
        onAssignSelected={assignSelectedToCampaign}
        onOpenCommandDrop={openCommandDropForSelection}
        formatSize={formatSize}
        getFileIcon={getFileIcon}
        labels={{
          noFilesTitle: t.library.noFilesTitle,
          noFilesDescription: t.library.noFilesDescription,
          selectAsset: t.library.selectAsset,
          deselectAsset: t.library.deselectAsset,
          linkedCampaigns: t.library.linkedCampaigns,
          none: t.library.none,
          unassigned: t.library.unassigned,
          assignToCampaign: t.library.assignToCampaign,
          draggingAssets: t.library.draggingAssets,
          campaignDock: t.library.campaignDock,
          selectedAssets: t.library.selectedAssets,
          unassignedCount: t.library.unassignedCount,
          assignSelectedHint: t.library.assignSelectedHint,
          noCampaignsFound: t.library.noCampaignsFound,
          noFilteredFiles: t.library.noFilteredFiles,
          dropToSearch: t.library.dropToSearch,
          dropToSearchHint: t.library.dropToSearchHint,
        }}
      />

      <AssetPreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />

      <AssetAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        selectedCount={selectedCount}
        campaignQuery={campaignQuery}
        onCampaignQueryChange={setCampaignQuery}
        assignTargetCampaignId={assignTargetCampaignId}
        onAssignTargetCampaignIdChange={setAssignTargetCampaignId}
        filteredCampaigns={filteredCampaigns}
        onAssign={assignSelectedToCampaign}
        isAssigning={assigningCampaignIds.has(assignTargetCampaignId)}
        labels={{
          title: t.library.assignToCampaign,
          selectedAssets: t.library.selectedAssets,
          searchCampaign: t.library.searchCampaign,
          searchPlaceholder: t.library.searchCampaignPlaceholder,
          selectCampaign: t.library.selectCampaign,
          noResults: t.library.noCampaignSearchResults,
          cancel: t.common.cancel,
          assignNow: t.library.assignNow,
        }}
      />

      <LibraryToasts
        showUndoToast={showUndoToast}
        showAssignErrorToast={showAssignErrorToast}
        lastAssignResult={lastAssignResult}
        hasUndoSnapshot={!!undoSnapshot}
        onUndo={handleUndoAssign}
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

      <Dialog isOpen={isBulkConfirmOpen} onClose={() => setIsBulkConfirmOpen(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>選択したファイルを一括削除しますか？</DialogTitle>
          <DialogDescription>
            選択された {selectedCount} 件のファイルをライブラリから完全に削除します。この操作は取り消せません。
            {linkedSelectedCount > 0 && (
              <span className="block mt-4 text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                注意: 選択中のファイルのうち {linkedSelectedCount} 件はキャンペーンに使用されているため、一括削除できません。先に紐付けを解除してください。
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setIsBulkConfirmOpen(false)} disabled={isBulkRemoving}>
            キャンセル
          </Button>
          <Button 
            variant="destructive" 
            onClick={onBulkRemove} 
            disabled={isBulkRemoving || linkedSelectedCount > 0}
            className={cn(
              "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20",
              (isBulkRemoving || linkedSelectedCount > 0) && "opacity-50 cursor-not-allowed grayscale-[0.5]"
            )}
          >
            {isBulkRemoving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            削除する
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
