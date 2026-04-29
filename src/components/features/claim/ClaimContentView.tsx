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

interface ClaimContentViewProps {
  files: ClaimFile[];
  expiryDate: Date;
}

export function ClaimContentView({ files, expiryDate }: ClaimContentViewProps) {
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

  const handleDownloadSingle = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    console.log(`Downloading: ${file.filename}`);
    alert(t.claim.downloadSingle.replace("{filename}", file.filename));
  };

  const handleDownloadSelected = async () => {
    const count = selectedFileIds.size === 0 ? files.length : selectedFileIds.size;
    const isAll = selectedFileIds.size === 0;

    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert(isAll 
        ? t.claim.downloadZip.replace("{count}", count.toString())
        : t.claim.downloadSelectedAlert.replace("{count}", count.toString())
      );
    }, 1000);
  };

  const allSelected = selectedFileIds.size === files.length && files.length > 0;

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
          <h2 className="text-3xl font-bold text-foreground">{t.claim.headerTitle}</h2>
          <p className="text-emerald-500 text-sm mt-1.5 font-medium tracking-wide">{t.claim.headerSubtitle}</p>
        </div>
        <CountdownBadge expiresAt={expiryDate} />
      </motion.div>

      <ClaimActionBar 
        itemCount={files.length} 
        allSelected={allSelected} 
        onSelectAll={selectAll} 
      />

      {/* ファイル一覧 */}
      <div className="space-y-10">
        {files.map((file, index) => (
          <ClaimFileCard
            key={file.id}
            file={file}
            index={index}
            isSelected={selectedFileIds.has(file.id)}
            onToggle={toggleSelection}
            onDownload={handleDownloadSingle}
          />
        ))}
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
          <Button 
            onClick={handleDownloadSelected}
            disabled={isDownloading}
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 shadow-[0_0_15px_oklch(0.645_0.165_158.452/0.3)] transition-all hover:scale-105"
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
        </div>
      </motion.div>
    </div>
  );
}
