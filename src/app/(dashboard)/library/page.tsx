"use client";

import { useState } from "react";
import { FileImage, FileAudio, File as FileIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { AssetPreviewModal } from "@/components/features/library/AssetPreviewModal";
import { AssetAssignModal } from "@/components/features/library/AssetAssignModal";
import { AssetFile } from "@/components/features/library/types";
import { useLibrary } from "@/hooks/features/library/useLibrary";

// サブコンポーネント
import { LibraryHeader } from "@/components/features/library/LibraryHeader";
import { LibraryFilters } from "@/components/features/library/LibraryFilters";
import { LibraryGrid } from "@/components/features/library/LibraryGrid";
import { LibraryToasts } from "@/components/features/library/LibraryToasts";

export default function LibraryPage() {
  const { t, locale } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<AssetFile | null>(null);

  const {
    files,
    campaigns,
    filter,
    setFilter,
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
    filteredCampaigns,
    sensors,
    handleFilesDropped,
    handleUndoAssign,
    handleDragStart,
    handleDragEnd,
    assignSelectedToCampaign,
    assignFilesToCampaign,
  } = useLibrary();

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

      <div className="mb-8">
        <FileDropzone onFilesDropped={handleFilesDropped} />
      </div>

      <LibraryFilters
        filter={filter}
        setFilter={setFilter}
        selectedCount={selectedCount}
        campaignsCount={campaigns.length}
        onClearSelection={() => setSelectedFileIds(new Set())}
        onOpenAssignModal={() => {
          setAssignTargetCampaignId(campaigns[0]?.id ?? "");
          setCampaignQuery("");
          setIsAssignModalOpen(true);
        }}
        labels={{
          filterType: t.library.filterType,
          fileType: t.library.fileType,
          clearSelection: t.library.clearSelection,
          assignToCampaign: t.library.assignToCampaign,
        }}
      />

      <LibraryGrid
        files={files}
        filteredFiles={filteredFiles}
        campaigns={campaigns}
        selectedFileIds={selectedFileIds}
        draggedFileIds={draggedFileIds}
        assigningCampaignIds={assigningCampaignIds}
        pulsedCampaignId={pulsedCampaignId}
        unassignedCount={unassignedCount}
        locale={locale}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onToggleSelection={toggleSelection}
        onPreview={setSelectedFile}
        onOpenAssign={openAssignModalForFile}
        onAssignSelected={assignSelectedToCampaign}
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
    </div>
  );
}
