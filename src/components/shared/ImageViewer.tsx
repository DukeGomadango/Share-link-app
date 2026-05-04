"use client";
import Image from "next/image";

export function ImageViewer({ src, priority = false }: { src: string; priority?: boolean }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-black/[0.05] aspect-video">
      <Image 
        src={src} 
        alt="Preview" 
        fill
        priority={priority}
        className="object-cover transition-transform duration-500 hover:scale-[1.02]"
        unoptimized
      />
    </div>
  );
}
