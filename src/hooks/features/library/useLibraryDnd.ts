"use client";

import { useState, useCallback } from "react";
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useCommandPaletteStore } from "@/stores/commandPaletteStore";

interface UseLibraryDndProps {
  selectedFileIds: Set<string>;
  setSelectedFileIds: (ids: Set<string>) => void;
  assignFilesToCampaign: (campaignId: string, fileIds: string[]) => void;
  setCommandDropOpenedAtTs: (ts: number) => void;
  setCampaignQuery: (q: string) => void;
}

export function useLibraryDnd({
  selectedFileIds,
  setSelectedFileIds,
  assignFilesToCampaign,
  setCommandDropOpenedAtTs,
  setCampaignQuery,
}: UseLibraryDndProps) {
  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const [pendingCommandDropFileIds, setPendingCommandDropFileIds] = useState<string[]>([]);
  
  const openCommandDropStore = useCommandPaletteStore((state) => state.open);
  const closeCommandDropStore = useCommandPaletteStore((state) => state.close);
  const setCommandDropQuery = useCommandPaletteStore((state) => state.setQuery);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const fileId = event.active.data.current?.fileId;
    if (typeof fileId !== "string") return;
    const shouldDragSelection = selectedFileIds.has(fileId) && selectedFileIds.size > 1;
    setDraggedFileIds(shouldDragSelection ? Array.from(selectedFileIds) : [fileId]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id.toString() ?? "";
    const dropSourceIds = draggedFileIds;
    setDraggedFileIds([]);
    if (dropSourceIds.length === 0) return;
    if (overId === "campaign-search-drop") {
      setPendingCommandDropFileIds(dropSourceIds);
      setCommandDropOpenedAtTs(Date.now());
      openCommandDropStore();
      return;
    }
    if (!overId.startsWith("campaign-drop-")) return;
    const campaignId = overId.replace("campaign-drop-", "");
    const isSelectionDrag = dropSourceIds.length > 1 || selectedFileIds.has(dropSourceIds[0] ?? "");
    assignFilesToCampaign(campaignId, dropSourceIds);
    
    if (isSelectionDrag) {
      setSelectedFileIds(new Set());
    }
  };

  const openCommandDropForSelection = useCallback(() => {
    if (selectedFileIds.size === 0) return;
    setPendingCommandDropFileIds(Array.from(selectedFileIds));
    setCommandDropQuery("");
    setCommandDropOpenedAtTs(Date.now());
    openCommandDropStore();
  }, [selectedFileIds, setCommandDropQuery, openCommandDropStore, setCommandDropOpenedAtTs]);

  const closeCommandDrop = useCallback(() => {
    closeCommandDropStore();
    setCommandDropQuery("");
    setPendingCommandDropFileIds([]);
  }, [closeCommandDropStore, setCommandDropQuery]);

  const assignFromCommandDrop = useCallback((campaignId: string) => {
    if (!campaignId || pendingCommandDropFileIds.length === 0) return;
    const shouldClearSelection =
      pendingCommandDropFileIds.length > 1 || selectedFileIds.has(pendingCommandDropFileIds[0] ?? "");
    assignFilesToCampaign(campaignId, pendingCommandDropFileIds);
    
    if (shouldClearSelection) {
      setSelectedFileIds(new Set());
    }
    
    closeCommandDrop();
    setCampaignQuery("");
  }, [pendingCommandDropFileIds, selectedFileIds, assignFilesToCampaign, closeCommandDrop, setSelectedFileIds, setCampaignQuery]);

  return {
    draggedFileIds,
    sensors,
    handleDragStart,
    handleDragEnd,
    openCommandDropForSelection,
    closeCommandDrop,
    assignFromCommandDrop,
  };
}
