"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CountdownBadge } from "@/components/shared/CountdownBadge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ClaimFile } from "./types";
import { useTranslation } from "@/lib/i18n";

// サブコンポーネント
import { ClaimFileCard } from "./ClaimFileCard";
import { ClaimActionBar } from "./ClaimActionBar";

import { downloadSingleFile, downloadFilesAsZip } from "@/lib/download-utils";
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
}

export function ClaimContentView({ files, expiryDate, campaignName }: ClaimContentViewProps) {
  const { t } = useTranslation();
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

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
    if (!file?.src) return;
    setIsDownloading(true);
    try {
      await downloadSingleFile(file.src, file.filename || "file");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadZip = async (targets: ClaimFile[]) => {
    setIsDownloading(true);
    try {
      await downloadFilesAsZip(
        targets.map(f => ({ src: f.src, filename: f.filename })),
        "dango-bundle.zip"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadIndividually = async (targets: ClaimFile[]) => {
    setIsDownloading(true);
    try {
      for (const f of targets) {
        if (f.src) {
          await downloadSingleFile(f.src, f.filename);
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleMainAction = () => {
    const targets =
      selectedFileIds.size === 0
        ? files
        : files.filter((f) => selectedFileIds.has(f.id));
    
    if (targets.length === 1) {
      handleDownloadSingle(targets[0].id);
    } else {
      // 複数ある場合はデフォルトで ZIP
      handleDownloadZip(targets);
    }
  };

  const allSelected = selectedFileIds.size === files.length && files.length > 0;
  const targets = selectedFileIds.size === 0
    ? files
    : files.filter((f) => selectedFileIds.has(f.id));

  return (
    <div className="w-full space-y-6 py-6 pb-32">
      {/* ヘッダー */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex justify-between items-start mb-2"
      >
        <div>
          <h2 className="text-3xl font-bold text-foreground">{campaignName}</h2>
          <p className="text-emerald-500 text-sm mt-1.5 font-medium tracking-wide">{t.claim.headerSubtitle}</p>
        </div>
        <CountdownBadge expiresAt={expiryDate} />
      </motion.div>

      <ClaimActionBar 
        itemCount={files.length} 
        allSelected={allSelected} 
        onSelectAll={selectAll} 
      />

      {/* ファイル一覧 (Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {files.map((file, index) => {
          // Bentoロジック: 最初のアイテム、または特定のインデックスで横幅を広げる
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
                onToggle={toggleSelection}
                onDownload={handleDownloadSingle}
              />
            </div>
          );
        })}
      </div>
      
      {/* フッター */}
      <div className="pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground/60 whitespace-pre-line">
          {t.claim.expiryNotice}
        </p>
      </div>

      {/* 固定ダウンロードバー */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-sm glass rounded-full p-2 flex items-center justify-between border border-border shadow-2xl shadow-emerald-500/10">
          <div className="px-4 text-sm font-medium">
            {selectedFileIds.size > 0 ? (
              <span className="text-emerald-500">{t.claim.selectedCount.replace("{count}", selectedFileIds.size.toString())}</span>
            ) : (
              <span className="text-muted-foreground">{t.claim.downloadBundle}</span>
            )}
          </div>

          <div className="flex gap-1">
            {targets.length > 1 ? (
              <DropdownMenu>
                <div className="flex items-center rounded-full bg-emerald-500 overflow-hidden shadow-[0_0_15px_oklch(0.645_0.165_158.452/0.3)] transition-all hover:scale-105">
                  <Button 
                    onClick={handleMainAction}
                    disabled={isDownloading}
                    className="rounded-none bg-transparent hover:bg-emerald-600 text-white px-5 h-10 border-r border-emerald-400/30"
                  >
                    {isDownloading ? (
                      <span className="animate-pulse">{t.claim.preparing}</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        {selectedFileIds.size === 0 ? t.claim.saveAll : t.claim.saveSelected}
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
                <DropdownMenuContent align="end" side="top" className="rounded-2xl border-border bg-background/80 backdrop-blur-xl mb-2 min-w-[180px]">
                  <DropdownMenuItem 
                    className="rounded-xl py-3 cursor-pointer focus:bg-emerald-500/10"
                    onClick={() => handleDownloadZip(targets)}
                  >
                    <Download className="w-4 h-4 mr-2 text-emerald-500" />
                    {t.claim.downloadAsZip}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="rounded-xl py-3 cursor-pointer focus:bg-emerald-500/10"
                    onClick={() => handleDownloadIndividually(targets)}
                  >
                    <Download className="w-4 h-4 mr-2 text-emerald-500" />
                    {t.claim.downloadIndividually}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={handleMainAction}
                disabled={isDownloading}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 h-10 shadow-[0_0_15px_oklch(0.645_0.165_158.452/0.3)] transition-all hover:scale-105"
              >
                {isDownloading ? (
                  <span className="animate-pulse">{t.claim.preparing}</span>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {selectedFileIds.size === 0 ? t.claim.saveAll : t.claim.saveSelected}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
