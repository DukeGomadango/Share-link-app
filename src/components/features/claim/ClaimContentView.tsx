"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { CountdownBadge } from "@/components/shared/CountdownBadge";
import { Button } from "@/components/ui/button";
import { Download, CheckSquare, Square, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClaimFile } from "./types";

interface ClaimContentViewProps {
  files: ClaimFile[];
  expiryDate: Date;
}

// 各ファイルカードの出現アニメーション
const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.15 + i * 0.12,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function ClaimContentView({ files, expiryDate }: ClaimContentViewProps) {
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
      setSelectedFileIds(new Set()); // すべて解除
    } else {
      setSelectedFileIds(new Set(files.map(f => f.id))); // すべて選択
    }
  };

  const handleDownloadSingle = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    console.log(`Downloading: ${file.filename}`);
    alert(`「${file.filename}」のダウンロードを開始します`);
  };

  const handleDownloadSelected = async () => {
    if (selectedFileIds.size === 0) {
      setSelectedFileIds(new Set(files.map(f => f.id)));
      setIsDownloading(true);
      setTimeout(() => {
        setIsDownloading(false);
        alert(`全 ${files.length} 件のファイルをZIPでダウンロードします`);
      }, 1000);
      return;
    }

    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert(`選択した ${selectedFileIds.size} 件のファイルをダウンロードします`);
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
          <h2 className="text-3xl font-bold text-foreground">A special delivery</h2>
          <p className="text-emerald-500 text-sm mt-1.5 font-medium tracking-wide">CONFIDENTIAL</p>
        </div>
        <CountdownBadge expiresAt={expiryDate} />
      </motion.div>

      {/* 操作バー */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center justify-between mb-4 border-b border-border/40 pb-4"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {files.length} items
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={selectAll}
          className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
        >
          {allSelected ? (
            <><CheckSquare className="w-4 h-4 mr-2" /> Deselect All</>
          ) : (
            <><Square className="w-4 h-4 mr-2" /> Select All</>
          )}
        </Button>
      </motion.div>

      {/* ファイル一覧 - stagger付きの出現アニメーション */}
      <div className="space-y-10">
        {files.map((file, index) => {
          const isSelected = selectedFileIds.has(file.id);
          
          return (
            <motion.div
              key={file.id}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className={cn(
                "relative group rounded-3xl transition-all duration-300 p-2",
                isSelected 
                  ? "bg-emerald-500/10 ring-2 ring-emerald-500/50 shadow-[0_0_30px_#10B98122]" 
                  : "hover:bg-accent/50"
              )}
            >
              {/* 選択チェックボックス */}
              <motion.div
                className="absolute -top-3 -left-3 z-20 cursor-pointer bg-background rounded-full p-0.5 shadow-sm"
                onClick={() => toggleSelection(file.id)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 fill-emerald-500/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center bg-background/50 backdrop-blur-sm group-hover:border-emerald-500/50 transition-colors" />
                )}
              </motion.div>

              {/* ダウンロードボタン */}
              <motion.div
                className="absolute -top-3 -right-3 z-20"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  size="icon"
                  className="rounded-full shadow-lg bg-background border border-border text-foreground hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all h-10 w-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadSingle(file.id);
                  }}
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </motion.div>

              {/* ファイルプレビュー */}
              <div className="pt-2">
                {file.type === "image" && (
                  <div className="space-y-3">
                    <ImageViewer src={file.src} watermarkText={file.watermarkText || "protected"} />
                    <p className="text-center text-sm font-medium text-muted-foreground">{file.title}</p>
                  </div>
                )}
                
                {file.type === "audio" && (
                  <AudioPlayer src={file.src} title={file.title || "Audio File"} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* フッター */}
      <div className="pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground/60">
          This link is unique to your device.<br/>If you lose access, please contact the sender.
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
              <span className="text-emerald-500">{selectedFileIds.size} Selected</span>
            ) : (
              <span className="text-muted-foreground">Download Complete Bundle</span>
            )}
          </div>
          <Button 
            onClick={handleDownloadSelected}
            disabled={isDownloading}
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 shadow-[0_0_15px_oklch(0.645_0.165_158.452/0.3)] transition-all hover:scale-105"
          >
            {isDownloading ? (
              <span className="animate-pulse">Preparing...</span>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {selectedFileIds.size === 0 ? "Save All" : "Save Selected"}
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
