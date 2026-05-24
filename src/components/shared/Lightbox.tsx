"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, File, Music, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClaimFile } from "@/components/features/claim/types";
import { useTranslation } from "@/lib/i18n";
import {
  canUseWebShare,
  isAndroidDevice,
  isIosDevice,
} from "@/lib/claim/device-save-hints";
import { shareFileFromUrl } from "@/lib/download-utils";
import { toast } from "sonner";

interface LightboxProps {
  files: ClaimFile[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDownload: (id: string) => void;
  /** 保存用 URL（claim API 等）。未指定時は file.src */
  getDownloadSrc?: (file: ClaimFile) => string;
}

export function Lightbox({
  files,
  currentIndex,
  onClose,
  onNavigate,
  onDownload,
  getDownloadSrc,
}: LightboxProps) {
  const { t } = useTranslation();
  const [isSharing, setIsSharing] = useState(false);
  const currentFile = files[currentIndex];
  const downloadUrl = currentFile
    ? (getDownloadSrc?.(currentFile) ?? currentFile.src)
    : "";

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

  const longPressHint = isIosDevice()
    ? t.claim.longPressHintIos
    : isAndroidDevice()
      ? t.claim.longPressHintAndroid
      : t.claim.longPressHintIos;

  const handleShare = async () => {
    if (!canUseWebShare()) {
      toast.message(t.claim.lightboxShareUnavailable);
      return;
    }
    setIsSharing(true);
    try {
      const ok = await shareFileFromUrl(
        downloadUrl,
        currentFile.filename,
        currentFile.title
      );
      if (!ok) {
        toast.message(t.claim.lightboxShareUnavailable);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
      >
        <div className="absolute inset-0" onClick={onClose} />

        <div className="absolute top-6 right-6 z-10 flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-none"
            onClick={onClose}
            aria-label={t.common.cancel}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {files.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate((currentIndex - 1 + files.length) % files.length);
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              type="button"
              className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate((currentIndex + 1) % files.length);
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        <motion.div
          key={currentFile.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-[1] flex max-h-[92dvh] w-full max-w-5xl flex-col items-center gap-4 pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pointer-events-auto flex w-full max-h-[min(58dvh,520px)] flex-1 items-center justify-center">
            {currentFile.type === "image" ? (
              /* eslint-disable-next-line @next/next/no-img-element -- 長押しで「写真に保存」を使えるようネイティブ img */
              <img
                src={currentFile.src}
                alt={currentFile.title || currentFile.filename}
                className="max-h-[min(58dvh,520px)] w-auto max-w-full rounded-xl object-contain select-none"
              />
            ) : (
              <div className="bg-white/5 rounded-[3rem] p-12 md:p-16 flex flex-col items-center gap-6 backdrop-blur-2xl border border-white/10 shadow-2xl">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-[2.5rem] bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  {currentFile.type === "audio" ? (
                    <Music className="w-10 h-10 md:w-14 md:h-14" />
                  ) : (
                    <File className="w-10 h-10 md:w-14 md:h-14" />
                  )}
                </div>
                <p className="text-white text-lg md:text-xl font-semibold text-center px-4">
                  {currentFile.title || currentFile.filename}
                </p>
              </div>
            )}
          </div>

          <div className="pointer-events-auto w-full max-w-lg space-y-3 px-2">
            <div className="text-center">
              <h3 className="text-white text-base font-medium truncate">
                {currentFile.title || currentFile.filename}
              </h3>
              <p className="text-white/50 text-sm mt-0.5">
                {currentIndex + 1} / {files.length}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                onClick={() => onDownload(currentFile.id)}
              >
                <Download className="w-4 h-4 mr-2" />
                {currentFile.type === "image"
                  ? t.claim.lightboxSaveImage
                  : t.common.download}
              </Button>
              {currentFile.type === "image" && canUseWebShare() && (
                <Button
                  variant="outline"
                  className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20 font-bold"
                  disabled={isSharing}
                  onClick={() => void handleShare()}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  {t.claim.lightboxShare}
                </Button>
              )}
            </div>

            {currentFile.type === "image" && (
              <p className="text-center text-xs text-white/60 leading-relaxed px-2">
                {longPressHint}
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
