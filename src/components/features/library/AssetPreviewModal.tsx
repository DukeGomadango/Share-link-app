"use client";

import { X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { AssetFile } from "./types";
import { useTranslation } from "@/lib/i18n";

interface AssetPreviewModalProps {
  file: AssetFile | null;
  onClose: () => void;
}

export function AssetPreviewModal({ file, onClose }: AssetPreviewModalProps) {
  const { t } = useTranslation();
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl">
        <Button
          variant="outline"
          size="icon"
          className="absolute -top-12 right-0 rounded-full bg-background/50 hover:bg-background"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
        
        {file.type.startsWith("image/") ? (
          <ImageViewer src={file.previewUrl || file.url} watermarkText="SAMPLE" />
        ) : file.type.startsWith("audio/") ? (
           <AudioPlayer src={file.previewUrl || file.url} title={file.name} />
        ) : (
          <GlassCard className="p-8 text-center text-muted-foreground">
            <FileIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t.library.previewNotAvailable}</p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
