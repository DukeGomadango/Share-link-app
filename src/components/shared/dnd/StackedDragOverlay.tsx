"use client";

import { GripVertical } from "lucide-react";

interface StackedDragOverlayProps {
  label: string;
}

export function StackedDragOverlay({ label }: StackedDragOverlayProps) {
  return (
    <div className="relative w-64 h-20">
      <div className="absolute inset-x-4 top-3 h-14 rounded-xl border border-border/70 bg-background/50 rotate-[-2deg] shadow-sm" />
      <div className="absolute inset-x-2 top-1 h-14 rounded-xl border border-border/80 bg-background/80 rotate-[2deg] shadow-md" />
      <div className="absolute inset-0 p-3 rounded-xl border border-emerald-500 bg-background/95 shadow-2xl flex items-center space-x-3 scale-105 transition-none pointer-events-none">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <GripVertical className="w-5 h-5 text-emerald-500 shrink-0" />
        </div>
        <span className="text-sm font-bold line-clamp-1">{label}</span>
      </div>
    </div>
  );
}
