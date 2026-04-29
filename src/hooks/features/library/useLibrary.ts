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
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "image" | "audio">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [sizeFilter, setSizeFilter] = useState<"all" | "small" | "medium" | "large">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d" | "90d">("all");
  const [selectedTag, setSelectedTag] = useState("all");
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
      return Object.fromEntries(entries);
    } catch {
      return {};
    }
  });
  const [isCommandDropOpen, setIsCommandDropOpen] = useState(false);
  const [commandDropQuery, setCommandDropQuery] = useState("");
  const [pendingCommandDropFileIds, setPendingCommandDropFileIds] = useState<string[]>([]);
  const [nowTs] = useState(() => Date.now());
  const [commandDropOpenedAtTs, setCommandDropOpenedAtTs] = useState(() => Date.now());

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

  useEffect(() => {
    window.localStorage.setItem("library:recent-campaign-ids", JSON.stringify(recentCampaignIds));
  }, [recentCampaignIds]);
  useEffect(() => {
    window.localStorage.setItem(
      "library:recent-campaign-touched-at",
      JSON.stringify(recentCampaignTouchedAtById)
    );
  }, [recentCampaignTouchedAtById]);

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

  const inferSmartTags = useCallback((file: AssetFile) => {
    const tags = new Set<string>();
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (file.type.startsWith("image/")) tags.add("image");
    else if (file.type.startsWith("audio/")) tags.add("audio");
    else tags.add("other");
    if (ext) tags.add(ext);
    if (file.size >= 10 * 1024 * 1024) tags.add("large");
    if (file.linkedCampaigns.length === 0) tags.add("unassigned");
    return Array.from(tags);
  }, []);

  const smartTags = useMemo(() => {
    const counts = new Map<string, number>();
    files.forEach((file) => {
      inferSmartTags(file).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [files, inferSmartTags]);

  const filteredFiles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return files.filter((file) => {
      if (fileTypeFilter === "image" && !file.type.startsWith("image/")) return false;
      if (fileTypeFilter === "audio" && !file.type.startsWith("audio/")) return false;
      if (unassignedOnly && file.linkedCampaigns.length > 0) return false;

      if (sizeFilter !== "all") {
        if (sizeFilter === "small" && file.size >= 1024 * 1024) return false;
        if (sizeFilter === "medium" && (file.size < 1024 * 1024 || file.size >= 10 * 1024 * 1024)) return false;
        if (sizeFilter === "large" && file.size < 10 * 1024 * 1024) return false;
      }

      if (dateFilter !== "all") {
        const createdAt = new Date(file.createdAt).getTime();
        const days = dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90;
        if (nowTs - createdAt > days * 24 * 60 * 60 * 1000) return false;
      }

      if (selectedTag !== "all" && !inferSmartTags(file).includes(selectedTag)) return false;

      if (normalizedQuery) {
        const haystack = `${file.name} ${file.linkedCampaigns.join(" ")}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [files, fileTypeFilter, unassignedOnly, sizeFilter, dateFilter, selectedTag, searchQuery, inferSmartTags, nowTs]);

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

  const rememberRecentCampaign = useCallback((campaignId: string) => {
    const touchedAt = Date.now();
    setRecentCampaignIds((prev) => [campaignId, ...prev.filter((id) => id !== campaignId)].slice(0, 10));
    setRecentCampaignTouchedAtById((prev) => ({ ...prev, [campaignId]: touchedAt }));
  }, []);

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
    
    if (options?.clearSelection !== false) {
      setSelectedFileIds(new Set());
    }
    setIsAssignModalOpen(false);
    setCampaignQuery("");
  }, [campaigns, rememberRecentCampaign]);

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
    if (dropSourceIds.length === 0) return;
    if (overId === "campaign-search-drop") {
      setPendingCommandDropFileIds(dropSourceIds);
      setCommandDropOpenedAtTs(Date.now());
      setIsCommandDropOpen(true);
      return;
    }
    if (!overId.startsWith("campaign-drop-")) return;
    const campaignId = overId.replace("campaign-drop-", "");
    const isSelectionDrag = dropSourceIds.length > 1 || selectedFileIds.has(dropSourceIds[0] ?? "");
    assignFilesToCampaign(campaignId, dropSourceIds, { clearSelection: isSelectionDrag });
  };

  const openCommandDropForSelection = () => {
    if (selectedFileIds.size === 0) return;
    setPendingCommandDropFileIds(Array.from(selectedFileIds));
    setCommandDropQuery("");
    setCommandDropOpenedAtTs(Date.now());
    setIsCommandDropOpen(true);
  };

  const closeCommandDrop = () => {
    setIsCommandDropOpen(false);
    setCommandDropQuery("");
    setPendingCommandDropFileIds([]);
  };

  const assignFromCommandDrop = (campaignId: string) => {
    if (!campaignId || pendingCommandDropFileIds.length === 0) return;
    const shouldClearSelection =
      pendingCommandDropFileIds.length > 1 || selectedFileIds.has(pendingCommandDropFileIds[0] ?? "");
    assignFilesToCampaign(campaignId, pendingCommandDropFileIds, { clearSelection: shouldClearSelection });
    closeCommandDrop();
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
    handleUndoAssign,
    handleDragStart,
    handleDragEnd,
    assignSelectedToCampaign,
    assignFilesToCampaign,
    openCommandDropForSelection,
    closeCommandDrop,
    assignFromCommandDrop,
  };
}
