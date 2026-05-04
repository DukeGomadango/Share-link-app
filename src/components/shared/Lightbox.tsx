"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, File, Music } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ClaimFile } from "@/components/features/claim/types";

interface LightboxProps {
  files: ClaimFile[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDownload: (id: string) => void;
}

export function Lightbox({
  files,
  currentIndex,
  onClose,
  onNavigate,
  onDownload,
}: LightboxProps) {
  const currentFile = files[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((currentIndex - 1 + files.length) % files.length);
      if (e.key === "ArrowRight") onNavigate((currentIndex + 1) % files.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, files.length, onClose, onNavigate]);

  if (!currentFile) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
      >
        {/* 背景クリックで閉じる */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* コントロール */}
        <div className="absolute top-6 right-6 z-10 flex gap-4">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none"
            onClick={() => onDownload(currentFile.id)}
          >
            <Download className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* ナビゲーション */}
        {files.length > 1 && (
          <>
            <button
              className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate((currentIndex - 1 + files.length) % files.length);
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate((currentIndex + 1) % files.length);
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        {/* コンテンツ */}
        <motion.div
          key={currentFile.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative max-w-5xl w-full max-h-full flex flex-col items-center gap-4 pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full aspect-video md:aspect-auto md:h-[70vh] flex items-center justify-center pointer-events-auto">
            {currentFile.type === "image" ? (
              <div className="relative w-full h-full">
                <Image
                  src={currentFile.src}
                  alt={currentFile.title || "Preview"}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="bg-white/5 rounded-[3rem] p-16 md:p-24 flex flex-col items-center gap-8 backdrop-blur-2xl border border-white/10 shadow-2xl">
                 <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                    {currentFile.type === "audio" ? (
                      <Music className="w-12 h-12 md:w-16 md:h-16" />
                    ) : (
                      <File className="w-12 h-12 md:w-16 md:h-16" />
                    )}
                 </div>
                 <div className="text-center space-y-2">
                   <p className="text-white text-xl md:text-2xl font-semibold tracking-tight">
                     {currentFile.title || currentFile.filename}
                   </p>
                   <p className="text-emerald-400/80 text-sm font-medium uppercase tracking-widest">
                     {currentFile.type}
                   </p>
                 </div>
              </div>
            )}
          </div>
          
          <div className="text-center pointer-events-auto">
            <h3 className="text-white text-lg font-medium">{currentFile.title || currentFile.filename}</h3>
            <p className="text-white/50 text-sm mt-1">{currentIndex + 1} / {files.length}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
