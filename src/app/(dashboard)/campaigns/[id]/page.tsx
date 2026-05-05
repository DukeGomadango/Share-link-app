"use client";
import { useCallback, useEffect, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Link as LinkIcon, Download, FileAudio, FileImage, Megaphone, Users, Calendar, X, Trash2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";

import { StackedDragOverlay } from "@/components/shared/dnd/StackedDragOverlay";
import { LibrarySelectModal } from "@/components/features/campaigns/LibrarySelectModal";
import { AddRecipientModal } from "@/components/features/campaigns/AddRecipientModal";
import { useCampaignDetail } from "@/hooks/features/campaigns/useCampaignDetail";

import { FilePoolSection } from "@/components/features/campaigns/FilePoolSection";
import { RecipientsSection } from "@/components/features/campaigns/RecipientsSection";

import { useTranslation } from "@/lib/i18n";
import { escapeCsvField } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

export default function CampaignDetailPage() {
  const { t } = useTranslation();
  const {
    campaignId,
    campaign,
    workflowLoading,
    workflowError,
    files,
    recipients,
    activeDragFile,
    activeDragRecipient,
    draggedFileIds,
    selectedFileIds,
    pulsedRecipientId,
    showLibraryModal,
    setShowLibraryModal,
    libraryFiles,
    sensors,
    fetchLibraryFiles,
    assignFromLibrary,
    handleUnassignFromCampaign,
    handleRemoveFile,
    handleRemoveRecipient,
    handleMergeRecipients,
    toggleSelection,
    setSelectedFiles,
    toggleAllSelection,
    handleDragStart,
    handleDragEnd,
    handleFilesDropped,
    deleteCampaign,
    reloadWorkflow,
  } = useCampaignDetail();

  const [exportBusy, setExportBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [addRecipientOpen, setAddRecipientOpen] = useState(false);
  const [addRecipientResetKey, setAddRecipientResetKey] = useState(0);
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"active" | "completed" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [banner, setBanner] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const handleUpdateStatus = useCallback(
    async (newStatus: "active" | "completed") => {
      if (!campaignId) return;
      setStatusBusy(true);
      setBanner(null);
      try {
        const r = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!r.ok) throw new Error();
        await reloadWorkflow();
        toast.success(newStatus === "active" ? "キャンペーンを公開しました" : "キャンペーンを終了しました");
      } catch {
        toast.error("ステータスの更新に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setStatusBusy(false);
      }
    },
    [campaignId, reloadWorkflow]
  );

  const handleExportCsv = useCallback(async () => {
    if (!campaignId) return;
    setExportBusy(true);
    setBanner(null);
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/claim-export`);
      if (!r.ok) throw new Error();
      const data = (await r.json()) as {
        rows: Array<{
          recipientDisplayName: string;
          assetLabel: string;
          status: string;
          externalTransactionId: string;
          claimUrl: string;
        }>;
        campaignName: string;
      };

      if (data.rows.length === 0) {
        toast.error(t.campaigns.exportNoClaims);
        return;
      }

      const header = [
        t.campaigns.csvRecipient,
        t.campaigns.csvAsset,
        t.campaigns.csvStatus,
        t.campaigns.csvExternalId,
        t.campaigns.csvLink,
      ];
      const lines = [
        header.map(escapeCsvField).join(","),
        ...data.rows.map((row) =>
          [
            row.recipientDisplayName,
            row.assetLabel,
            row.status,
            row.externalTransactionId,
            row.claimUrl,
          ]
            .map(escapeCsvField)
            .join(",")
        ),
      ];
      const csv = `\uFEFF${lines.join("\r\n")}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = data.campaignName.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 80);
      a.download = `${safeName || "campaign"}-claims.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setBanner({ tone: "ok", text: t.campaigns.exportDone });
    } catch {
      toast.error(t.campaigns.exportFailed);
    } finally {
      setExportBusy(false);
    }
  }, [campaignId, t]);

  const handleBulkIssue = useCallback(async () => {
    if (!campaignId) return;
    if (files.length === 0) {
      toast.error(t.campaigns.bulkIssueNoAssets);
      return;
    }
    setBulkBusy(true);
    setBanner(null);
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/bulk-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { message?: string };
        throw new Error(j.message ?? "");
      }
      await reloadWorkflow();
      toast.success(t.campaigns.bulkIssueDone);
    } catch {
      toast.error(t.campaigns.bulkIssueFailed);
    } finally {
      setBulkBusy(false);
    }
  }, [campaignId, files.length, reloadWorkflow, t]);

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <div className="flex items-center space-x-2 text-sm text-emerald-500 mb-1">
            <span className="uppercase tracking-wider font-semibold text-xs">{t.campaigns.directCampaign}</span>
            <span>•</span>
            <span className="text-muted-foreground font-mono text-xs">{campaign?.id ?? "…"}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {workflowLoading ? "…" : campaign?.name ?? t.campaigns.campaignFlow}
            </h1>
            {!workflowLoading && campaign && (
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  campaign.status === "active"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : campaign.status === "completed"
                    ? "bg-slate-500/10 text-slate-500 border-slate-500/20"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                )}
              >
                {t.campaigns.status[campaign.status]}
              </span>
            )}
          </div>
          {!workflowLoading && campaign && campaignId ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">配布方式</span>
              <select
                className="rounded-lg border border-border/60 bg-background/80 px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                value={campaign.distributionMode ?? "per_link"}
                onChange={(e) => {
                  const v = e.target.value;
                  void (async () => {
                    const r = await fetch(`/api/campaigns/${campaignId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ distributionMode: v }),
                    });
                    if (r.ok) await reloadWorkflow();
                  })();
                }}
              >
                <option value="per_link">個別リンク（従来）</option>
                <option value="reception">共通受付（チェックイン）</option>
              </select>

              <div className="flex items-center gap-2 ml-2 pl-4 border-l border-border/30">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  有効期限
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="datetime-local"
                    className="rounded-lg border border-border/60 bg-background/80 px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                    value={campaign.expiresAt ? new Date(new Date(campaign.expiresAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return;
                      void (async () => {
                        const r = await fetch(`/api/campaigns/${campaignId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ expiresAt: new Date(v).toISOString() }),
                        });
                        if (r.ok) await reloadWorkflow();
                      })();
                    }}
                  />
                  {campaign.expiresAt && (
                    <button
                      onClick={() => {
                        void (async () => {
                          const r = await fetch(`/api/campaigns/${campaignId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ expiresAt: null }),
                          });
                          if (r.ok) await reloadWorkflow();
                        })();
                      }}
                      className="p-1 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors"
                      title="期限をクリア"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {campaign.distributionMode === "reception" &&
              campaign.publicReceptionToken ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={campaign.status !== "active"}
                  onClick={() => {
                    const u = `${window.location.origin}/receive/${campaign.publicReceptionToken}`;
                    void navigator.clipboard.writeText(u);
                    toast.success("受付URLをコピーしました");
                  }}
                  title={campaign.status !== "active" ? "公開するとコピーできるようになります" : ""}
                >
                  受付URLをコピー
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex space-x-3">
          <Button
            className={cn(
              "shadow-lg transition-all",
              campaign?.status === "draft"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-slate-200 hover:bg-slate-300 text-slate-900 shadow-slate-200/20"
            )}
            disabled={workflowLoading || !campaignId || statusBusy}
            onClick={() => {
              if (campaign?.status === "draft") {
                setPendingStatus("active");
                setConfirmOpen(true);
              } else if (campaign?.status === "active") {
                setPendingStatus("completed");
                setConfirmOpen(true);
              } else if (campaign?.status === "completed") {
                setPendingStatus("active");
                setConfirmOpen(true);
              }
            }}
          >
            {statusBusy ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : campaign?.status === "active" ? (
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
            ) : (
              <Megaphone className="w-4 h-4 mr-2" />
            )}
            {campaign?.status === "active"
              ? "公開中（終了する）"
              : campaign?.status === "completed"
              ? "終了済み（再開する）"
              : "キャンペーンを公開する"}
          </Button>
          <Button
            variant="outline"
            className="glass"
            disabled={workflowLoading || !campaignId || exportBusy}
            onClick={() => void handleExportCsv()}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportBusy ? t.campaigns.exporting : t.campaigns.exportLinks}
          </Button>
          <Button
            variant="outline"
            className="glass"
            disabled={workflowLoading || !campaignId || bulkBusy || files.length === 0 || campaign?.status !== "active"}
            onClick={() => void handleBulkIssue()}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            {bulkBusy ? t.campaigns.bulkIssuing : t.campaigns.generateAll}
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            disabled={workflowLoading || !campaignId || isDeleting}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t.common.delete}
          </Button>
        </div>
      </div>

      {workflowError && (
        <p className="text-sm text-destructive border border-destructive/30 rounded-lg px-3 py-2 bg-destructive/5">
          {workflowError}
        </p>
      )}

      {banner && (
        <div
          className={cn(
            "p-4 rounded-xl border flex items-center justify-between animate-in fade-in slide-in-from-top-2",
            banner.tone === "ok"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          )}
        >
          <div className="flex items-center gap-2">
            {banner.tone === "ok" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <p className="text-sm font-medium">{banner.text}</p>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="p-1 hover:bg-black/5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {workflowLoading ? (
        <div className="flex-1 rounded-xl border border-border/50 bg-muted/20 animate-pulse min-h-[240px]" />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
            <FilePoolSection
              files={files}
              selectedFileIds={selectedFileIds}
              onToggleSelection={toggleSelection}
              onToggleAllSelection={toggleAllSelection}
              onSelectMultiple={setSelectedFiles}
              onFilesDropped={handleFilesDropped}
              onOpenLibrary={() => {
                setShowLibraryModal(true);
                fetchLibraryFiles();
              }}
              onUnassignFiles={handleUnassignFromCampaign}
            />

              <RecipientsSection
                recipients={recipients}
                files={files}
                pulsedRecipientId={pulsedRecipientId}
                onRemoveFile={handleRemoveFile}
                onRemoveRecipient={handleRemoveRecipient}
                onMerge={handleMergeRecipients}
                readOnly={false}
              onAddRecipients={() => {
                setAddRecipientResetKey((k) => k + 1);
                setAddRecipientOpen(true);
              }}
              addRecipientsDisabled={workflowLoading || campaign?.status !== "active"}
              showPoolEmptyHint={!workflowLoading && files.length === 0}
              isDraft={campaign?.status === "draft"}
            />
          </div>

          <DragOverlay>
            {activeDragRecipient ? (
              <div className="p-4 rounded-2xl border border-sky-500 bg-background/95 shadow-2xl flex items-center space-x-3 rotate-2 scale-105 cursor-grabbing min-w-[200px] transition-none pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-500">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{activeDragRecipient.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Recipient</p>
                </div>
              </div>
            ) : activeDragFile ? (
              draggedFileIds.length > 1 ? (
                <StackedDragOverlay
                  label={t.campaigns.filesSelected.replace("{count}", draggedFileIds.length.toString())}
                />
              ) : (
                <div className="p-3 rounded-lg border border-emerald-500 bg-background/90 shadow-2xl flex items-center space-x-3 rotate-3 scale-105 cursor-grabbing transition-none pointer-events-none">
                  <div className="p-2 bg-emerald-500/20 rounded-md text-emerald-500 shrink-0 relative overflow-hidden flex items-center justify-center w-10 h-10">
                    {activeDragFile.type === "image" && activeDragFile.previewUrl ? (
                      <Image
                        src={activeDragFile.previewUrl}
                        alt={activeDragFile.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : activeDragFile.type === "audio" ? (
                      <FileAudio className="w-5 h-5" />
                    ) : (
                      <FileImage className="w-5 h-5" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium line-clamp-1">{activeDragFile.name}</p>
                  </div>
                </div>
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <LibrarySelectModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        libraryFiles={libraryFiles}
        assignedAssetIds={files.map((f) => f.libraryAssetId).filter(Boolean) as string[]}
        onAssignSelected={assignFromLibrary}
      />

      {campaignId ? (
        <AddRecipientModal
          key={addRecipientResetKey}
          isOpen={addRecipientOpen}
          onClose={() => setAddRecipientOpen(false)}
          campaignId={campaignId}
          poolFiles={files}
          onIssued={async () => {
            await reloadWorkflow();
            toast.success(t.campaigns.addRecipientSuccess);
          }}
        />
      ) : null}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (pendingStatus) void handleUpdateStatus(pendingStatus);
        }}
        title={
          pendingStatus === "active" 
            ? (campaign?.status === "completed" ? "キャンペーンを再開" : "キャンペーンを公開")
            : "キャンペーンを終了"
        }
        description={
          pendingStatus === "active"
            ? (campaign?.status === "completed" 
                ? "キャンペーンを再開しますか？リスナーが再びアクセスできるようになります。" 
                : "キャンペーンを公開しますか？これ以降、リスナーがファイルを受け取れるようになります。")
            : "キャンペーンを終了しますか？終了すると、リスナーはファイルの受け取りができなくなります。"
        }
        confirmText={
          pendingStatus === "active" 
            ? (campaign?.status === "completed" ? "再開する" : "公開する")
            : "終了する"
        }
        variant={pendingStatus === "active" ? "emerald" : "destructive"}
        isLoading={statusBusy}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          await deleteCampaign();
          setIsDeleting(false);
        }}
        title={t.campaigns.deleteConfirmTitle}
        description={t.campaigns.deleteConfirmDescription}
        confirmText={t.common.delete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
