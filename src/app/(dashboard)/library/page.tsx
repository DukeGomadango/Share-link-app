"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FolderOpen,
  FileImage,
  FileAudio,
  File as FileIcon,
  X,
  Check,
  Plus,
  Layers,
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

  const assignSelectedToCampaign = (campaignId: string) => {
    const targetCampaign = campaigns.find((campaign) => campaign.id === campaignId);
    if (!targetCampaign || selectedFileIds.size === 0) return;
    const selectedIds = new Set(selectedFileIds);
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
    });

    setShowUndoToast(true);
    window.setTimeout(() => setShowUndoToast(false), 5000);
    setSelectedFileIds(new Set());
    setIsAssignModalOpen(false);
    setCampaignQuery("");
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
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map((file) => {
              const isSelected = selectedFileIds.has(file.id);
              return (
                <GlassCard
                  key={file.id}
                  className={`relative group hover:border-emerald-500/50 transition-colors flex flex-col h-full cursor-pointer ${
                    isSelected ? "border-emerald-500" : ""
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <button
                      type="button"
                      aria-label={isSelected ? t.library.deselectAsset : t.library.selectAsset}
                      className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-border hover:border-emerald-500"
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSelection(file.id);
                      }}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                    </button>
                    <div className="p-3 bg-muted rounded-xl flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="flex justify-between text-xs text-muted-foreground mb-3">
                      <span>{formatSize(file.size)}</span>
                      <span>
                        {new Date(file.createdAt).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US")}
                      </span>
                    </div>

                    {file.linkedCampaigns.length === 0 ? (
                      <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500 mb-3">
                        {t.library.unassigned}
                      </span>
                    ) : null}

                    <div className="pt-3 border-t border-border/50">
                      <p className="text-xs font-semibold mb-1 text-emerald-500/80">
                        {t.library.linkedCampaigns}
                      </p>
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
                        <span className="text-xs text-muted-foreground">{t.library.none}</span>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        openAssignModalForFile(file.id);
                      }}
                    >
                      {t.library.assignToCampaign}
                    </Button>
                  </div>
                </GlassCard>
              );
            })}
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
                <button
                  key={campaign.id}
                  type="button"
                  className="w-full text-left p-3 rounded-lg border border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedCount === 0}
                  onClick={() => assignSelectedToCampaign(campaign.id)}
                >
                  <p className="text-sm font-medium line-clamp-1">{campaign.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t.library.assignSelectedHint}</p>
                </button>
              ))}
              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.library.noCampaignsFound}</p>
              ) : null}
            </div>
          </GlassCard>
        </div>
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
                disabled={!assignTargetCampaignId || selectedCount === 0 || filteredCampaigns.length === 0}
              >
                {t.library.assignNow}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {showUndoToast && (
        <div className="fixed right-4 bottom-4 z-[60] w-full max-w-sm rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl p-4">
          <p className="text-sm font-medium">{t.library.assignComplete}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t.library.assignTarget
              .replace("{campaign}", lastAssignResult.campaignName || "-")}
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
        </div>
      )}
    </div>
  );
}
