"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import {
  FolderOpen,
  FileImage,
  FileAudio,
  File as FileIcon,
  X,
  Check,
  Plus,
  Layers,
  Loader2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { useTranslation } from "@/lib/i18n";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { ImageViewer } from "@/components/shared/ImageViewer";

interface AssetFile {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  url: string;
  linkedCampaigns: string[];
}

interface CampaignSummary {
  id: string;
  name: string;
}

interface UndoAssignmentPayload {
  linksByFileId: Record<string, string[]>;
}

interface AssignResult {
  added: number;
  skipped: number;
  campaignName: string;
}

interface DraggableAssetCardProps {
  file: AssetFile;
  isSelected: boolean;
  locale: string;
  assigning: boolean;
  selectAssetLabel: string;
  deselectAssetLabel: string;
  linkedCampaignsLabel: string;
  noneLabel: string;
  unassignedLabel: string;
  assignToCampaignLabel: string;
  formatSize: (bytes: number) => string;
  getFileIcon: (type: string) => ReactNode;
  onToggleSelection: (fileId: string) => void;
  onPreview: (file: AssetFile) => void;
  onOpenAssign: (fileId: string) => void;
}

function DraggableAssetCard({
  file,
  isSelected,
  locale,
  assigning,
  selectAssetLabel,
  deselectAssetLabel,
  linkedCampaignsLabel,
  noneLabel,
  unassignedLabel,
  assignToCampaignLabel,
  formatSize,
  getFileIcon,
  onToggleSelection,
  onPreview,
  onOpenAssign,
}: DraggableAssetCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-file-${file.id}`,
    data: { fileId: file.id },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <GlassCard
      ref={setNodeRef}
      style={style}
      className={`relative group hover:border-emerald-500/50 transition-colors flex flex-col h-full cursor-pointer ${
        isSelected ? "border-emerald-500" : ""
      } ${isDragging ? "opacity-50" : ""}`}
      onClick={() => onPreview(file)}
    >
      <div className="flex justify-between items-start mb-4">
        <button
          type="button"
          aria-label={isSelected ? deselectAssetLabel : selectAssetLabel}
          className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
            isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-border hover:border-emerald-500"
          }`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelection(file.id);
          }}
        >
          {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
        </button>
        <button
          type="button"
          className="p-2 rounded-md border border-border/60 hover:border-emerald-500/50 text-muted-foreground hover:text-emerald-500"
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
          aria-label="Drag asset"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="p-3 bg-muted rounded-xl flex items-center justify-center">{getFileIcon(file.type)}</div>
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1" title={file.name}>
          {file.name}
        </h3>
        <div className="flex justify-between text-xs text-muted-foreground mb-3">
          <span>{formatSize(file.size)}</span>
          <span>{new Date(file.createdAt).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US")}</span>
        </div>

        {file.linkedCampaigns.length === 0 ? (
          <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500 mb-3">
            {unassignedLabel}
          </span>
        ) : null}

        <div className="pt-3 border-t border-border/50">
          <p className="text-xs font-semibold mb-1 text-emerald-500/80">{linkedCampaignsLabel}</p>
          {file.linkedCampaigns.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {file.linkedCampaigns.map((c, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full inline-block"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{noneLabel}</span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          disabled={assigning}
          onClick={(event) => {
            event.stopPropagation();
            onOpenAssign(file.id);
          }}
        >
          {assigning ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
          {assignToCampaignLabel}
        </Button>
      </div>
    </GlassCard>
  );
}

function CampaignDockItem({
  campaign,
  disabled,
  assigning,
  successPulse,
  onAssign,
  assignSelectedHint,
}: {
  campaign: CampaignSummary;
  disabled: boolean;
  assigning: boolean;
  successPulse: boolean;
  onAssign: () => void;
  assignSelectedHint: string;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `campaign-drop-${campaign.id}`,
  });

  return (
    <motion.button
      ref={setNodeRef}
      type="button"
      initial={false}
      animate={
        successPulse
          ? {
              scale: [1, 1.02, 1],
              boxShadow: [
                "0 0 0 rgba(16,185,129,0)",
                "0 0 0 6px rgba(16,185,129,0.18)",
                "0 0 0 rgba(16,185,129,0)",
              ],
            }
          : undefined
      }
      transition={{ duration: 0.42, ease: "easeOut" }}
      className={`w-full text-left p-3 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isOver
          ? "border-emerald-500 bg-emerald-500/20"
          : successPulse
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/5"
      }`}
      disabled={disabled || assigning}
      onClick={onAssign}
    >
      <p className="text-sm font-medium line-clamp-1 flex items-center gap-2">
        {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" /> : null}
        {campaign.name}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{assignSelectedHint}</p>
    </motion.button>
  );
}

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
  const { t, locale } = useTranslation();

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
    // 実際のアプリケーションでは、ここでFormDataを使用してサーバーにアップロードします
    console.log("Files ready to upload:", droppedFiles);
    try {
      const res = await fetch("/api/files", { method: "POST" });
      if (res.ok) {
        // アップロード成功後、ファイルリストを再取得
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
      // ローカル復元は済んでいるため、失敗時は無視してUXを優先する
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
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                  className="relative w-64 h-20"
                >
                  <motion.div
                    animate={{ y: [0, -2, 0], rotate: [-2, -1, -2] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-x-4 top-3 h-14 rounded-lg border border-border/70 bg-background/85"
                  />
                  <motion.div
                    animate={{ y: [0, -3, 0], rotate: [2, 1, 2] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-x-2 top-1 h-14 rounded-lg border border-border/80 bg-background/90"
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 p-3 rounded-lg border border-emerald-500 bg-background/95 shadow-xl flex items-center space-x-2"
                  >
                    <GripVertical className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium line-clamp-1">
                      {t.library.draggingAssets.replace("{count}", String(draggedFileIds.length))}
                    </span>
                  </motion.div>
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

      {/* 簡易的なプレビューモーダル */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl">
            <Button
              variant="outline"
              size="icon"
              className="absolute -top-12 right-0 rounded-full bg-background/50 hover:bg-background"
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-5 h-5" />
            </Button>
            
            {selectedFile.type.startsWith("image/") ? (
              <ImageViewer src={selectedFile.url} watermarkText="SAMPLE" />
            ) : selectedFile.type.startsWith("audio/") ? (
               <AudioPlayer src={selectedFile.url} title={selectedFile.name} />
            ) : (
              <GlassCard className="p-8 text-center text-muted-foreground">
                <FileIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Preview not available for this file type.</p>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-md">
            <h3 className="text-lg font-semibold mb-1">{t.library.assignToCampaign}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t.library.selectedAssets.replace("{count}", String(selectedCount))}
            </p>
            <label className="text-sm font-medium mb-2 block">{t.library.searchCampaign}</label>
            <input
              value={campaignQuery}
              onChange={(event) => setCampaignQuery(event.target.value)}
              placeholder={t.library.searchCampaignPlaceholder}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-4"
            />
            <label className="text-sm font-medium mb-2 block">{t.library.selectCampaign}</label>
            <select
              value={assignTargetCampaignId}
              onChange={(event) => setAssignTargetCampaignId(event.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
            >
              {filteredCampaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
            {filteredCampaigns.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-2">{t.library.noCampaignSearchResults}</p>
            ) : null}
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                {t.common.cancel}
              </Button>
              <Button
                className="bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={() => assignSelectedToCampaign(assignTargetCampaignId)}
                disabled={
                  !assignTargetCampaignId ||
                  selectedCount === 0 ||
                  filteredCampaigns.length === 0 ||
                  assigningCampaignIds.has(assignTargetCampaignId)
                }
              >
                {assigningCampaignIds.has(assignTargetCampaignId) ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : null}
                {t.library.assignNow}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

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
    </div>
  );
}
