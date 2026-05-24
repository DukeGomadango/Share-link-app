"use client";

import { X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { ImageViewer } from "@/components/shared/ImageViewer";
import { useAssetSignedUrl } from "@/hooks/useAssetSignedUrl";
import { AssetFile } from "./types";
import { useTranslation } from "@/lib/i18n";

interface AssetPreviewModalProps {
  file: AssetFile | null;
  onClose: () => void;
}

export function AssetPreviewModal({ file, onClose }: AssetPreviewModalProps) {
  const { t } = useTranslation();
  const needsMedia =
    !!file &&
    (file.type.startsWith("image/") || file.type.startsWith("audio/"));
  const { url: mediaUrl, loading } = useAssetSignedUrl(
    file?.id,
    needsMedia,
    "view"
  );

  if (!file) return null;

  const src = mediaUrl || file.previewUrl || file.url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-3 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={file.name}
    >
      <div className="relative flex w-full max-w-2xl flex-col items-center">
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-0 z-10 size-10 rounded-full bg-background/80 shadow-sm hover:bg-background sm:-top-12"
          onClick={onClose}
          aria-label={t.common.cancel}
        >
          <X className="size-5" />
        </Button>

        {loading ? (
          <GlassCard className="mt-12 w-full p-12 text-center text-muted-foreground sm:mt-0">
            {t.common.loading}
          </GlassCard>
        ) : file.type.startsWith("image/") && src ? (
          <div className="mt-12 w-full sm:mt-0">
            <ImageViewer src={src} fit="contain" alt={file.name} />
          </div>
        ) : file.type.startsWith("audio/") && src ? (
          <AudioPlayer src={src} title={file.name} />
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
