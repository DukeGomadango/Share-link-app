"use client";

import Image from "next/image";
import { File, FileAudio, FileImage } from "lucide-react";

import { useAssetSignedUrl } from "@/hooks/useAssetSignedUrl";
import { cn } from "@/lib/utils";

type AssetThumbPreviewProps = {
  fileId: string;
  mimeType: string;
  name: string;
  /** レガシー一覧の url（空のときは署名 URL のみ） */
  fallbackUrl?: string;
  imageClassName?: string;
  iconSize?: "sm" | "md";
  lazy?: boolean;
};

export function AssetThumbPreview({
  fileId,
  mimeType,
  name,
  fallbackUrl,
  imageClassName,
  iconSize = "md",
  lazy = true,
}: AssetThumbPreviewProps) {
  const isImage = mimeType.startsWith("image/");
  const { url: signedUrl, inViewRef } = useAssetSignedUrl(fileId, isImage, "preview", {
    lazy,
  });
  const legacy = fallbackUrl?.trim();
  const imageSrc = signedUrl || legacy || null;

  const iconClass = iconSize === "sm" ? "w-6 h-6" : "w-8 h-8";

  if (!isImage) {
    if (mimeType.startsWith("audio/")) {
      return <FileAudio className={cn(iconClass, "text-emerald-500")} />;
    }
    return <File className={cn(iconClass, "text-muted-foreground")} />;
  }

  if (imageSrc) {
    return (
      <Image
        src={imageSrc}
        alt={name}
        fill
        className={cn("object-cover", imageClassName)}
        unoptimized
      />
    );
  }

  return (
    <div ref={inViewRef} className="absolute inset-0 bg-muted/40 animate-pulse" aria-hidden />
  );
}

/** 非画像向けアイコン（StepFileSelect の色分け用） */
export function assetMimeIcon(mimeType: string, className?: string) {
  if (mimeType.startsWith("image/")) {
    return <FileImage className={className} />;
  }
  if (mimeType.startsWith("audio/")) {
    return <FileAudio className={className} />;
  }
  return <File className={className} />;
}
