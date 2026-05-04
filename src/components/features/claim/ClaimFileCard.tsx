"use client";

import { motion } from "framer-motion";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { cn } from "@/lib/utils";
import { ClaimFile } from "./types";

import { useTranslation } from "@/lib/i18n";

interface ClaimFileCardProps {
  file: ClaimFile;
  index: number;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onDownload: (id: string) => void;
}

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

export function ClaimFileCard({
  file,
  index,
  isSelected,
  onToggle,
  onDownload,
}: ClaimFileCardProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative group rounded-[2rem] transition-all duration-500 p-4 bg-white border border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.1)] hover:-translate-y-1",
        isSelected 
          ? "bg-emerald-50/50 ring-2 ring-emerald-500/40 shadow-[0_20px_40px_rgba(16,185,129,0.15)]" 
          : "hover:bg-white"
      )}
    >
      {/* 選択チェックボックス */}
      <motion.div
        className="absolute top-4 left-4 z-20 cursor-pointer bg-white rounded-full shadow-sm"
        onClick={() => onToggle(file.id)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isSelected ? (
          <CheckCircle2 className="w-7 h-7 text-emerald-500 fill-emerald-500/20" />
        ) : (
          <div className="w-7 h-7 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center bg-white/50 backdrop-blur-sm group-hover:border-emerald-500/40 transition-colors" />
        )}
      </motion.div>

      {/* ダウンロードボタン */}
      <motion.div
        className="absolute top-4 right-4 z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="icon"
          className="rounded-full shadow-lg bg-white/80 backdrop-blur-md border border-white text-foreground hover:bg-emerald-500 hover:text-white transition-all h-9 w-9"
          onClick={(e) => {
            e.stopPropagation();
            onDownload(file.id);
          }}
          title={t.common.download}
        >
          <Download className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* ファイルプレビュー */}
      <div className="pt-12">
        {file.type === "image" && (
          <div className="space-y-3">
            <ImageViewer src={file.src} priority={index === 0} />
            <p className="text-center text-sm font-medium text-muted-foreground">{file.title}</p>
          </div>
        )}
        
        {file.type === "audio" && (
          <AudioPlayer src={file.src} title={file.title || t.library.fileType.audio} />
        )}
      </div>
    </motion.div>
  );
}
