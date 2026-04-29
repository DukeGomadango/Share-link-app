"use client";

import { motion } from "framer-motion";
import { Download, CheckCircle2, FileImage, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { cn } from "@/lib/utils";
import { ClaimFile } from "./types";

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
  return (
    <motion.div
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
        onClick={() => onToggle(file.id)}
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
            onDownload(file.id);
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
}
