"use client";

import Image from "next/image";

type ImageViewerProps = {
  src: string;
  priority?: boolean;
  /** プレビューモーダルでは contain、サムネイル枠では cover */
  fit?: "cover" | "contain";
  alt?: string;
};

export function ImageViewer({
  src,
  priority = false,
  fit = "cover",
  alt = "Preview",
}: ImageViewerProps) {
  if (fit === "contain") {
    return (
      <div className="flex w-full max-w-2xl items-center justify-center rounded-2xl border border-black/[0.05] bg-muted/20 p-2 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- 元のアスペクト比を保つ */}
        <img
          src={src}
          alt={alt}
          className="max-h-[min(70dvh,720px)] w-auto max-w-full rounded-xl object-contain"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-black/[0.05] shadow-sm">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover transition-transform duration-500 hover:scale-[1.02]"
        unoptimized
      />
    </div>
  );
}
