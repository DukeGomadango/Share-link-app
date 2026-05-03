"use client";

import { useCallback, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Link as LinkIcon, Download, FileAudio, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import { StackedDragOverlay } from "@/components/shared/dnd/StackedDragOverlay";
import { LibrarySelectModal } from "@/components/features/campaigns/LibrarySelectModal";
import { AddRecipientModal } from "@/components/features/campaigns/AddRecipientModal";
import { useCampaignDetail } from "@/hooks/features/campaigns/useCampaignDetail";

import { FilePoolSection } from "@/components/features/campaigns/FilePoolSection";
import { RecipientsSection } from "@/components/features/campaigns/RecipientsSection";

import { useTranslation } from "@/lib/i18n";
import { escapeCsvField } from "@/lib/csv";

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
    draggedFileIds,
    selectedFileIds,
    pulsedRecipientId,
    showLibraryModal,
    setShowLibraryModal,
    libraryFiles,
    sensors,
    fetchLibraryFiles,
    assignFromLibrary,
    handleRemoveFile,
    toggleSelection,
    handleDragStart,
    handleDragEnd,
    handleFilesDropped,
    reloadWorkflow,
  } = useCampaignDetail();

  const [exportBusy, setExportBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [addRecipientOpen, setAddRecipientOpen] = useState(false);
  const [addRecipientResetKey, setAddRecipientResetKey] = useState(0);

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
        setBanner({ tone: "err", text: t.campaigns.exportNoClaims });
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
      setBanner({ tone: "err", text: t.campaigns.exportFailed });
    } finally {
      setExportBusy(false);
    }
  }, [campaignId, t]);

  const handleBulkIssue = useCallback(async () => {
    if (!campaignId) return;
    if (files.length === 0) {
      setBanner({ tone: "err", text: t.campaigns.bulkIssueNoAssets });
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
      setBanner({ tone: "ok", text: t.campaigns.bulkIssueDone });
    } catch {
      setBanner({ tone: "err", text: t.campaigns.bulkIssueFailed });
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
          <h1 className="text-3xl font-bold tracking-tight">
            {workflowLoading ? "…" : campaign?.name ?? t.campaigns.campaignFlow}
          </h1>
        </div>
        <div className="flex space-x-3">
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
            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg"
            disabled={workflowLoading || !campaignId || bulkBusy || files.length === 0}
            onClick={() => void handleBulkIssue()}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            {bulkBusy ? t.campaigns.bulkIssuing : t.campaigns.generateAll}
          </Button>
        </div>
      </div>

      {banner && (
        <p
          className={`text-sm rounded-lg px-3 py-2 border ${
            banner.tone === "ok"
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          {banner.text}
        </p>
      )}

      {workflowError && (
        <p className="text-sm text-destructive border border-destructive/30 rounded-lg px-3 py-2 bg-destructive/5">
          {workflowError}
        </p>
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
              onFilesDropped={handleFilesDropped}
              onOpenLibrary={() => {
                setShowLibraryModal(true);
                fetchLibraryFiles();
              }}
            />

            <RecipientsSection
              recipients={recipients}
              files={files}
              pulsedRecipientId={pulsedRecipientId}
              onRemoveFile={handleRemoveFile}
              readOnly
              onAddRecipients={() => {
                setAddRecipientResetKey((k) => k + 1);
                setAddRecipientOpen(true);
              }}
              addRecipientsDisabled={workflowLoading}
              showPoolEmptyHint={!workflowLoading && files.length === 0}
            />
          </div>

          <DragOverlay>
            {activeDragFile ? (
              draggedFileIds.length > 1 ? (
                <StackedDragOverlay
                  label={t.campaigns.filesSelected.replace("{count}", draggedFileIds.length.toString())}
                />
              ) : (
                <div className="p-3 rounded-lg border border-emerald-500 bg-background/90 shadow-2xl flex items-center space-x-3 rotate-3 scale-105 cursor-grabbing">
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
            setBanner({ tone: "ok", text: t.campaigns.addRecipientSuccess });
          }}
        />
      ) : null}
    </div>
  );
}
