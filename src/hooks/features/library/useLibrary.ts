"use client";

import { useState } from "react";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";
import { useLibraryFiles } from "./useLibraryFiles";
import { useLibraryCampaigns } from "./useLibraryCampaigns";
import { useLibraryAssignment } from "./useLibraryAssignment";
import { useLibraryDnd } from "./useLibraryDnd";

export function useLibrary() {
  // 1. Files & Filters
  const {
    files,
    setFiles,
    filteredFiles,
    smartTags,
    unassignedCount,
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
    handleFilesDropped,
    handleRename,
    handleDelete,
    handleBulkDelete,
    uploadError,
    setUploadError,
  } = useLibraryFiles();

  // 2. Campaigns & Search
  const {
    campaigns,
    campaignQuery,
    setCampaignQuery,
    recentCampaignIds,
    commandDropResults,
    recentCampaigns,
    filteredCampaigns,
    rememberRecentCampaign,
    setCommandDropOpenedAtTs,
  } = useLibraryCampaigns();

  // 3. Selection
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const selectedCount = selectedFileIds.size;
  const toggleSelection = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  // 4. Assignment
  const {
    isAssignModalOpen,
    setIsAssignModalOpen,
    assignTargetCampaignId,
    setAssignTargetCampaignId,
    undoSnapshot,
    lastAssignResult,
    assigningCampaignIds,
    pulsedCampaignId,
    showUndoToast,
    setShowUndoToast,
    showAssignErrorToast,
    assignFilesToCampaign,
    handleUndoAssign,
  } = useLibraryAssignment({
    files,
    setFiles,
    campaigns,
    rememberRecentCampaign,
  });

  // 5. Drag & Drop / Command Drop
  const {
    draggedFileIds,
    sensors,
    handleDragStart,
    handleDragEnd,
    openCommandDropForSelection,
    closeCommandDrop,
    assignFromCommandDrop,
  } = useLibraryDnd({
    selectedFileIds,
    setSelectedFileIds,
    assignFilesToCampaign,
    setCommandDropOpenedAtTs,
    setCampaignQuery,
  });

  // Stores for external synchronization
  const isCommandDropOpen = useCommandPaletteStore((state) => state.isOpen);
  const commandDropQuery = useCommandPaletteStore((state) => state.query);
  const setCommandDropQuery = useCommandPaletteStore((state) => state.setQuery);

  const assignSelectedToCampaign = (campaignId: string) => {
    assignFilesToCampaign(campaignId, Array.from(selectedFileIds));
    setSelectedFileIds(new Set());
  };

  return {
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
    setShowUndoToast,
    showAssignErrorToast,
    undoSnapshot,
    filteredFiles,
    selectedCount,
    unassignedCount,
    filteredCampaigns,
    recentCampaigns,
    isCommandDropOpen,
    commandDropQuery,
    setCommandDropQuery,
    commandDropResults,
    recentCampaignIds,
    sensors,
    handleFilesDropped,
    handleRename,
    handleDelete,
    handleBulkDelete,
    handleUndoAssign,
    handleDragStart,
    handleDragEnd,
    assignSelectedToCampaign,
    assignFilesToCampaign,
    openCommandDropForSelection,
    closeCommandDrop,
    assignFromCommandDrop,
    uploadError,
    setUploadError,
  };
}
