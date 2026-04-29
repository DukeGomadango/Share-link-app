"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  AssetFile,
  CampaignSummary,
  UndoAssignmentPayload,
  AssignResult,
} from "@/components/features/library/types";

export function useLibrary() {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetCampaignId, setAssignTargetCampaignId] = useState<string>("");
  const [campaignQuery, setCampaignQuery] = useState("");
  const [undoSnapshot, setUndoSnapshot] = useState<UndoAssignmentPayload | null>(null);
  const [lastAssignResult, setLastAssignResult] = useState<AssignResult>({
    added: 0,
    skipped: 0,
    campaignName: "",
  });
  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const [assigningCampaignIds, setAssigningCampaignIds] = useState<Set<string>>(new Set());
  const [pulsedCampaignId, setPulsedCampaignId] = useState<string | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [showAssignErrorToast, setShowAssignErrorToast] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchFiles = useCallback(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((data) => setFiles(data))
      .catch((e) => console.error("Failed to fetch files:", e));
  }, []);

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
    fetchFiles();
    fetchCampaigns();
  }, [fetchFiles, fetchCampaigns]);

  const handleFilesDropped = async (droppedFiles: File[]) => {
    console.log("Files ready to upload:", droppedFiles);
    try {
      const res = await fetch("/api/files", { method: "POST" });
      if (res.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (filter === "image") return f.type.startsWith("image/");
      if (filter === "audio") return f.type.startsWith("audio/");
      return true;
    });
  }, [files, filter]);

  const selectedCount = selectedFileIds.size;
  const unassignedCount = useMemo(
    () => files.filter((file) => file.linkedCampaigns.length === 0).length,
    [files]
  );

  const filteredCampaigns = useMemo(() => {
    const normalizedQuery = campaignQuery.trim().toLowerCase();
    if (!normalizedQuery) return campaigns;
    return campaigns.filter((campaign) => campaign.name.toLowerCase().includes(normalizedQuery));
  }, [campaigns, campaignQuery]);

  const toggleSelection = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const assignFilesToCampaign = useCallback((
    campaignId: string,
    sourceFileIds: string[],
    options?: { clearSelection?: boolean }
  ) => {
    const targetCampaign = campaigns.find((campaign) => campaign.id === campaignId);
    if (!targetCampaign || sourceFileIds.length === 0) return;
    const selectedIds = new Set(sourceFileIds);
    let snapshotForUndo: UndoAssignmentPayload = { linksByFileId: {} };
    const assignResult: AssignResult = { added: 0, skipped: 0, campaignName: targetCampaign.name };

    setFiles((prev) => {
      snapshotForUndo = {
        linksByFileId: Object.fromEntries(
          prev
            .filter((file) => selectedIds.has(file.id))
            .map((file) => [file.id, [...file.linkedCampaigns]])
        ),
      };
      return prev.map((file) => {
        if (!selectedIds.has(file.id)) return file;
        if (file.linkedCampaigns.includes(targetCampaign.name)) {
          assignResult.skipped += 1;
          return file;
        }
        assignResult.added += 1;
        return {
          ...file,
          linkedCampaigns: [...file.linkedCampaigns, targetCampaign.name],
        };
      });
    });

    setLastAssignResult(assignResult);
    setUndoSnapshot(assignResult.added > 0 ? snapshotForUndo : null);
    
    if (assignResult.added > 0) {
      setPulsedCampaignId(campaignId);
      window.setTimeout(() => setPulsedCampaignId((prev) => (prev === campaignId ? null : prev)), 450);
    }
    
    setAssigningCampaignIds((prev) => new Set(prev).add(campaignId));

    fetch("/api/files/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileIds: Array.from(selectedIds),
        campaignName: targetCampaign.name,
      }),
    }).catch(() => {
      if (!snapshotForUndo) return;
      setFiles((prev) =>
        prev.map((file) => {
          const restored = snapshotForUndo.linksByFileId[file.id];
          return restored ? { ...file, linkedCampaigns: restored } : file;
        })
      );
      setShowUndoToast(false);
      setShowAssignErrorToast(true);
      window.setTimeout(() => setShowAssignErrorToast(false), 5000);
    }).finally(() => {
      setAssigningCampaignIds((prev) => {
        const next = new Set(prev);
        next.delete(campaignId);
        return next;
      });
    });

    setShowUndoToast(true);
    window.setTimeout(() => setShowUndoToast(false), 5000);
    
    if (options?.clearSelection !== false) {
      setSelectedFileIds(new Set());
    }
    setIsAssignModalOpen(false);
    setCampaignQuery("");
  }, [campaigns]);

  const assignSelectedToCampaign = (campaignId: string) => {
    assignFilesToCampaign(campaignId, Array.from(selectedFileIds), { clearSelection: true });
  };

  const handleUndoAssign = () => {
    if (!undoSnapshot) return;
    setFiles((prev) =>
      prev.map((file) => {
        const restored = undoSnapshot.linksByFileId[file.id];
        return restored ? { ...file, linkedCampaigns: restored } : file;
      })
    );
    void fetch("/api/files/restore-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(undoSnapshot),
    }).catch(() => {
    });
    setUndoSnapshot(null);
    setShowUndoToast(false);
  };

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
    if (!overId.startsWith("campaign-drop-")) return;
    if (dropSourceIds.length === 0) return;
    const campaignId = overId.replace("campaign-drop-", "");
    const isSelectionDrag = dropSourceIds.length > 1 || selectedFileIds.has(dropSourceIds[0] ?? "");
    assignFilesToCampaign(campaignId, dropSourceIds, { clearSelection: isSelectionDrag });
  };

  return {
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
    setShowUndoToast,
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
  };
}
