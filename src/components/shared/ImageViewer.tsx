"use client";
/* eslint-disable @next/next/no-img-element */

export function ImageViewer({ src }: { src: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-black/[0.05]">
      <img 
        src={src} 
        alt="Preview" 
        className="w-full h-auto object-cover transition-transform duration-500 hover:scale-[1.02]"
      />
    </div>
  );
}
