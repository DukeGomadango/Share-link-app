"use client";

import { useState, useCallback } from "react";
import { AssetFile, CampaignSummary, UndoAssignmentPayload, AssignResult } from "@/components/features/library/types";

interface UseLibraryAssignmentProps {
  files: AssetFile[];
  setFiles: React.Dispatch<React.SetStateAction<AssetFile[]>>;
  campaigns: CampaignSummary[];
  rememberRecentCampaign: (id: string) => void;
}

export function useLibraryAssignment({
  files,
  setFiles,
  campaigns,
  rememberRecentCampaign,
}: UseLibraryAssignmentProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetCampaignId, setAssignTargetCampaignId] = useState<string>("");
  const [undoSnapshot, setUndoSnapshot] = useState<UndoAssignmentPayload | null>(null);
  const [lastAssignResult, setLastAssignResult] = useState<AssignResult>({
    added: 0,
    skipped: 0,
    campaignName: "",
  });
  const [assigningCampaignIds, setAssigningCampaignIds] = useState<Set<string>>(new Set());
  const [pulsedCampaignId, setPulsedCampaignId] = useState<string | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [showAssignErrorToast, setShowAssignErrorToast] = useState(false);

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
    rememberRecentCampaign(campaignId);
    
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
    
    setIsAssignModalOpen(false);
  }, [campaigns, rememberRecentCampaign, setFiles]);

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

  return {
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
  };
}
