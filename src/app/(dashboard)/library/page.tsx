"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  FolderOpen,
  FileImage,
  FileAudio,
  File as FileIcon,
  Plus,
  Layers,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { StackedDragOverlay } from "@/components/shared/dnd/StackedDragOverlay";
import { useTranslation } from "@/lib/i18n";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DraggableAssetCard } from "@/components/features/library/DraggableAssetCard";
import { CampaignDockItem } from "@/components/features/library/CampaignDockItem";
import { AssetPreviewModal } from "@/components/features/library/AssetPreviewModal";
import { AssetAssignModal } from "@/components/features/library/AssetAssignModal";
import {
  AssetFile,
  CampaignSummary,
  UndoAssignmentPayload,
  AssignResult,
} from "@/components/features/library/types";

export default function LibraryPage() {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<AssetFile | null>(null);
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
  const { t, locale } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchFiles = () => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((data) => setFiles(data))
      .catch((e) => console.error("Failed to fetch files:", e));
  };

  useEffect(() => {
    fetchFiles();
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

  const filteredFiles = files.filter((f) => {
    if (filter === "image") return f.type.startsWith("image/");
    if (filter === "audio") return f.type.startsWith("audio/");
    return true;
  });

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

  const assignFilesToCampaign = (
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

    void fetch("/api/files/assign", {
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
  };

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

  const openAssignModalForFile = (fileId: string) => {
    setSelectedFileIds(new Set([fileId]));
    setAssignTargetCampaignId(campaigns[0]?.id ?? "");
    setCampaignQuery("");
    setIsAssignModalOpen(true);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.library.title}</h1>
          <p className="text-muted-foreground mt-1">{t.library.subtitle}</p>
        </div>
      </div>

      <div className="mb-8">
        <FileDropzone onFilesDropped={handleFilesDropped} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm font-medium mr-2">{t.library.filterType}:</span>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-emerald-500 text-white" : ""}
        >
          {t.library.fileType.all}
        </Button>
        <Button
          variant={filter === "image" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("image")}
          className={filter === "image" ? "bg-emerald-500 text-white" : ""}
        >
          {t.library.fileType.image}
        </Button>
        <Button
          variant={filter === "audio" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("audio")}
          className={filter === "audio" ? "bg-emerald-500 text-white" : ""}
        >
          {t.library.fileType.audio}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedFileIds(new Set())}
          disabled={selectedCount === 0}
        >
          {t.library.clearSelection}
        </Button>
        <Button
          size="sm"
          className="bg-emerald-500 text-white hover:bg-emerald-600"
          disabled={selectedCount === 0 || campaigns.length === 0}
          onClick={() => {
            setAssignTargetCampaignId(campaigns[0]?.id ?? "");
            setCampaignQuery("");
            setIsAssignModalOpen(true);
          }}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          {t.library.assignToCampaign} ({selectedCount})
        </Button>
      </div>

      {files.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t.library.noFilesTitle}</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {t.library.noFilesDescription}
          </p>
        </GlassCard>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFiles.map((file) => (
                <DraggableAssetCard
                  key={file.id}
                  file={file}
                  isSelected={selectedFileIds.has(file.id)}
                  locale={locale}
                  assigning={assigningCampaignIds.size > 0}
                  selectAssetLabel={t.library.selectAsset}
                  deselectAssetLabel={t.library.deselectAsset}
                  linkedCampaignsLabel={t.library.linkedCampaigns}
                  noneLabel={t.library.none}
                  unassignedLabel={t.library.unassigned}
                  assignToCampaignLabel={t.library.assignToCampaign}
                  formatSize={formatSize}
                  getFileIcon={getFileIcon}
                  onToggleSelection={toggleSelection}
                  onPreview={setSelectedFile}
                  onOpenAssign={openAssignModalForFile}
                />
              ))}
            </div>

            <GlassCard className="sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center">
                  <Layers className="w-4 h-4 mr-2 text-emerald-500" />
                  {t.library.campaignDock}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {t.library.selectedAssets.replace("{count}", String(selectedCount))}
                </span>
              </div>
              <div className="mb-4 text-xs text-muted-foreground">
                {t.library.unassignedCount.replace("{count}", String(unassignedCount))}
              </div>
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <CampaignDockItem
                    key={campaign.id}
                    campaign={campaign}
                    disabled={selectedCount === 0 && draggedFileIds.length === 0}
                    assigning={assigningCampaignIds.has(campaign.id)}
                    successPulse={pulsedCampaignId === campaign.id}
                    assignSelectedHint={t.library.assignSelectedHint}
                    onAssign={() => assignSelectedToCampaign(campaign.id)}
                  />
                ))}
                {campaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.library.noCampaignsFound}</p>
                ) : null}
              </div>
            </GlassCard>
          </div>

          <DragOverlay>
            {draggedFileIds.length > 0 ? (
              draggedFileIds.length > 1 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                >
                  <StackedDragOverlay
                    label={t.library.draggingAssets.replace("{count}", String(draggedFileIds.length))}
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  className="p-3 rounded-lg border border-emerald-500 bg-background/95 shadow-xl flex items-center space-x-2"
                >
                  <GripVertical className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">
                    {files.find((file) => file.id === draggedFileIds[0])?.name ?? "Asset"}
                  </span>
                </motion.div>
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

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

      <AnimatePresence>
        {showUndoToast ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
            className="fixed right-4 bottom-4 z-[60] w-full max-w-sm rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl p-4"
          >
            <p className="text-sm font-medium">{t.library.assignComplete}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t.library.assignTarget.replace("{campaign}", lastAssignResult.campaignName || "-")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t.library.assignAdded.replace("{count}", String(lastAssignResult.added))}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.library.assignSkipped.replace("{count}", String(lastAssignResult.skipped))}
            </p>
            {undoSnapshot ? (
              <div className="mt-3 flex justify-end">
                <Button variant="outline" size="sm" onClick={handleUndoAssign}>
                  {t.library.undo}
                </Button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showAssignErrorToast ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
            className="fixed right-4 bottom-4 z-[60] w-full max-w-sm rounded-xl border border-red-500/50 bg-red-500/10 backdrop-blur-sm shadow-xl p-4"
          >
            <p className="text-sm font-medium text-red-600">{t.library.assignRestoreErrorTitle}</p>
            <p className="text-xs text-red-700 mt-1">{t.library.assignRestoreErrorBody}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
