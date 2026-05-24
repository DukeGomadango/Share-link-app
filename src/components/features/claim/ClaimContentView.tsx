"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CountdownBadge } from "@/components/shared/CountdownBadge";
import { Button } from "@/components/ui/button";
import { Download, Gift } from "lucide-react";
import { ClaimFile } from "./types";
import { useTranslation } from "@/lib/i18n";

import { ClaimFileCard } from "./ClaimFileCard";
import { ClaimActionBar } from "./ClaimActionBar";
import { ClaimInAppBrowserBanner } from "./ClaimInAppBrowserBanner";
import { ClaimSaveTips } from "./ClaimSaveTips";
import { Lightbox } from "@/components/shared/Lightbox";

import { claimDownloadUrl } from "@/lib/claim/download-url";
import {
  BULK_SAVE_WARN_THRESHOLD,
  isInAppBrowser,
} from "@/lib/claim/device-save-hints";
import {
  downloadSingleFile,
  downloadFilesAsZip,
  downloadFilesSequentially,
  type DownloadEntry,
} from "@/lib/download-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClaimContentViewProps {
  files: ClaimFile[];
  expiryDate: Date;
  campaignName: string;
  claimToken?: string;
  hideActionBar?: boolean;
  onOpenCollection?: () => void;
}

type DownloadProgress = { current: number; total: number };

export function ClaimContentView({ files, expiryDate, campaignName, claimToken, hideActionBar, onOpenCollection }: ClaimContentViewProps) {
  const { t } = useTranslation();
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [failedFileIds, setFailedFileIds] = useState<Set<string>>(new Set());
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(null);

  const downloadSrc = (file: ClaimFile) =>
    claimToken ? claimDownloadUrl(claimToken, file.id) : file.src;

  const toDownloadEntries = (targets: ClaimFile[]): DownloadEntry[] =>
    targets.map((f) => ({
      id: f.id,
      src: downloadSrc(f),
      filename: f.filename,
    }));

  const notifyDownloadResult = (
    succeeded: number,
    failed: string[],
    failedIds: string[]
  ) => {
    if (failedIds.length > 0) {
      setFailedFileIds((prev) => {
        const next = new Set(prev);
        for (const id of failedIds) next.add(id);
        return next;
      });
    }

    if (failed.length === 0) return;

    if (succeeded === 0) {
      toast.error(t.claim.downloadAllFailed);
      if (isInAppBrowser()) {
        toast.message(t.claim.downloadBlockedHint, { duration: 8000 });
      }
      return;
    }

    toast.warning(
      t.claim.downloadPartialFailure.replace("{count}", String(failed.length))
    );
    if (isInAppBrowser() && failed.length > 1) {
      toast.message(t.claim.downloadBlockedHint, { duration: 8000 });
    }
  };

  const markFileSaveResult = (fileId: string, ok: boolean) => {
    setFailedFileIds((prev) => {
      const next = new Set(prev);
      if (ok) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedFileIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFileIds(newSelected);
  };

  const selectAll = () => {
    if (selectedFileIds.size === files.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(files.map(f => f.id)));
    }
  };

  const handleDownloadSingle = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    const src = file ? downloadSrc(file) : "";
    if (!src) return;
    setIsDownloading(true);
    setDownloadProgress(null);
    try {
      const ok = await downloadSingleFile(src, file!.filename || "file");
      markFileSaveResult(fileId, ok);
      if (!ok) {
        toast.error(t.claim.downloadAllFailed);
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleDownloadZip = async (targets: ClaimFile[]) => {
    setIsDownloading(true);
    setDownloadProgress(null);
    try {
      await downloadFilesAsZip(toDownloadEntries(targets), "dango-bundle.zip");
    } catch (error) {
      console.error("ZIP download failed:", error);
      toast.error(t.claim.downloadAllFailed);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleDownloadIndividually = async (targets: ClaimFile[]) => {
    if (targets.length === 0) return;
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: targets.length });
    try {
      const { succeeded, failed, failedIds } = await downloadFilesSequentially(
        toDownloadEntries(targets),
        {
          onProgress: (current, total) => {
            setDownloadProgress({ current, total });
          },
        }
      );
      notifyDownloadResult(succeeded, failed, failedIds);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const handleMainAction = () => {
    const targets =
      selectedFileIds.size === 0
        ? files
        : files.filter((f) => selectedFileIds.has(f.id));

    if (targets.length === 1) {
      void handleDownloadSingle(targets[0]!.id);
    } else {
      void handleDownloadIndividually(targets);
    }
  };

  const actionButtonLabel = () => {
    if (isDownloading && downloadProgress && downloadProgress.total > 1) {
      return t.claim.savingProgress
        .replace("{current}", downloadProgress.current.toString())
        .replace("{total}", downloadProgress.total.toString());
    }
    if (isDownloading) {
      return t.claim.preparing;
    }
    return selectedFileIds.size === 0 ? t.claim.saveAll : t.claim.saveSelected;
  };

  const allSelected = selectedFileIds.size === files.length && files.length > 0;
  const targets = selectedFileIds.size === 0
    ? files
    : files.filter((f) => selectedFileIds.has(f.id));

  const showBulkWarning = targets.length >= BULK_SAVE_WARN_THRESHOLD;

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <div className="w-full space-y-6 py-6 pb-36">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex justify-between items-start mb-2"
      >
        <div>
          <h2 className="text-3xl font-bold text-foreground">{campaignName}</h2>
        </div>
        <div className="flex flex-col items-end gap-3">
          <CountdownBadge expiresAt={expiryDate} />
          {onOpenCollection && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenCollection}
              className="rounded-xl border-emerald-100 bg-white/50 backdrop-blur-sm text-emerald-600 hover:bg-emerald-50 transition-colors gap-2 font-bold px-4 h-9 shadow-sm"
            >
              <Gift className="w-4 h-4" />
              {t.claim.collectionTitle}
            </Button>
          )}
        </div>
      </motion.div>

      <ClaimInAppBrowserBanner />

      <ClaimActionBar 
        itemCount={files.length} 
        allSelected={allSelected} 
        onSelectAll={selectAll} 
      />

      <ClaimSaveTips />

      {showBulkWarning && (
        <p className="text-sm text-amber-800/90 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 leading-relaxed">
          {t.claim.bulkSaveWarning.replace("{count}", String(targets.length))}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {files.map((file, index) => {
          const isLarge = index === 0 && file.type === "image";
          
          return (
            <div 
              key={file.id} 
              className={cn(
                isLarge ? "md:col-span-2 lg:col-span-2" : "col-span-1"
              )}
            >
              <ClaimFileCard
                file={file}
                index={index}
                isSelected={selectedFileIds.has(file.id)}
                saveFailed={failedFileIds.has(file.id)}
                onToggle={toggleSelection}
                onDownload={handleDownloadSingle}
                onClick={() => setActivePreviewIndex(index)}
              />
            </div>
          );
        })}
      </div>
      
      <div className="pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground/60 whitespace-pre-line">
          {t.claim.expiryNotice}
        </p>
      </div>

      {!hideActionBar && mounted && createPortal(
        <div className="fixed-bottom-bar-safe fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="h-32 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/80 to-transparent" />
          <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-0 right-0 flex justify-center px-4"
        >
          <div className="pointer-events-auto w-full max-w-sm bg-white/70 backdrop-blur-2xl rounded-full p-2 flex items-center justify-between border border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
            <div className="px-4 text-sm font-medium min-w-0">
              {isDownloading && downloadProgress && downloadProgress.total > 1 ? (
                <span className="text-emerald-500 truncate block">
                  {t.claim.savingProgress
                    .replace("{current}", downloadProgress.current.toString())
                    .replace("{total}", downloadProgress.total.toString())}
                </span>
              ) : selectedFileIds.size > 0 ? (
                <span className="text-emerald-500">{t.claim.selectedCount.replace("{count}", selectedFileIds.size.toString())}</span>
              ) : (
                <span className="text-muted-foreground">{t.claim.downloadBundle}</span>
              )}
            </div>

            <div className="flex gap-1 shrink-0">
              {targets.length > 1 ? (
                <DropdownMenu>
                  <div className="flex items-center rounded-full bg-emerald-500 overflow-hidden shadow-[0_0_15px_oklch(0.645_0.165_158.452/0.3)] transition-all hover:scale-105">
                    <Button 
                      onClick={handleMainAction}
                      disabled={isDownloading}
                      className="rounded-none bg-transparent hover:bg-emerald-600 text-white px-5 h-10 border-r border-emerald-400/30 font-bold max-w-[11rem] truncate"
                    >
                      {isDownloading ? (
                        <span className="animate-pulse truncate">{actionButtonLabel()}</span>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2 shrink-0" />
                          <span className="truncate">{actionButtonLabel()}</span>
                        </>
                      )}
                    </Button>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        disabled={isDownloading}
                        className="rounded-none bg-transparent hover:bg-emerald-600 text-white w-8 h-10"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </div>
                  <DropdownMenuContent align="end" side="top" className="rounded-2xl border-white/20 bg-white/80 backdrop-blur-xl mb-2 min-w-[200px] shadow-xl">
                    <DropdownMenuItem 
                      className="rounded-xl py-3 cursor-pointer focus:bg-emerald-500/10 font-bold"
                      onClick={() => void handleDownloadZip(targets)}
                    >
                      <Download className="w-4 h-4 mr-2 text-emerald-500" />
                      {t.claim.downloadAsZip}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={handleMainAction}
                  disabled={isDownloading}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 h-10 shadow-[0_0_15px_oklch(0.645_0.165_158.452/0.3)] transition-all hover:scale-105 font-bold"
                >
                  {isDownloading ? (
                    <span className="animate-pulse">{actionButtonLabel()}</span>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {actionButtonLabel()}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          </motion.div>
        </div>,
        document.body
      )}

      {activePreviewIndex !== null && (
        <Lightbox
          files={files}
          currentIndex={activePreviewIndex}
          onClose={() => setActivePreviewIndex(null)}
          onNavigate={(index) => setActivePreviewIndex(index)}
          onDownload={handleDownloadSingle}
          getDownloadSrc={downloadSrc}
        />
      )}
    </div>
  );
}
