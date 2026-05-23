"use client";

import Image from "next/image";
import { File, FileAudio } from "lucide-react";

import { useAssetSignedUrl } from "@/hooks/useAssetSignedUrl";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import type { FileItem } from "./types";

type CampaignFileThumbProps = {
  file: FileItem;
  className?: string;
  iconClassName?: string;
  priority?: boolean;
  lazy?: boolean;
};

export function CampaignFileThumb({
  file,
  className,
  iconClassName = "w-6 h-6",
  priority = false,
  lazy = true,
}: CampaignFileThumbProps) {
  const isImage = file.type === "image";
  const signId = file.libraryAssetId;
  const legacyUrl = file.previewUrl?.trim() || null;

  const { ref: inViewRef, inView } = useInView({
    enabled: lazy && isImage && !!signId && !legacyUrl,
  });

  const shouldSign = isImage && !!signId && !legacyUrl && (!lazy || inView);
  const { url: signedUrl } = useAssetSignedUrl(signId, shouldSign, "preview", {
    lazy: false,
  });

  const imageSrc = legacyUrl || signedUrl;

  if (isImage && imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt={file.name}
        fill
        priority={priority}
        className={cn("object-cover", className)}
        unoptimized
      />
    );
  }

  if (isImage) {
    return (
      <div
        ref={inViewRef}
        className={cn("absolute inset-0 bg-muted/40 animate-pulse", className)}
        aria-hidden
      />
    );
  }

  if (file.type === "audio") {
    return <FileAudio className={cn(iconClassName, "text-emerald-500")} />;
  }

  return <File className={cn(iconClassName, "text-muted-foreground")} />;
}
