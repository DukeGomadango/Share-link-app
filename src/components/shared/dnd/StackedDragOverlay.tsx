"use client";

import { GripVertical } from "lucide-react";

interface StackedDragOverlayProps {
  label: string;
}

export function StackedDragOverlay({ label }: StackedDragOverlayProps) {
  return (
    <div className="relative w-64 h-20">
      <div className="absolute inset-x-4 top-3 h-14 rounded-lg border border-border/70 bg-background/85" />
      <div className="absolute inset-x-2 top-1 h-14 rounded-lg border border-border/80 bg-background/90" />
      <div className="absolute inset-0 p-3 rounded-lg border border-emerald-500 bg-background/95 shadow-xl flex items-center space-x-2">
        <GripVertical className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-medium line-clamp-1">{label}</span>
      </div>
    </div>
  );
}
