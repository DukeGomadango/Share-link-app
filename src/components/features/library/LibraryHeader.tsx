"use client";

import { Info } from "lucide-react";

interface LibraryHeaderProps {
  title: string;
  subtitle: string;
}

export function LibraryHeader({ title, subtitle }: LibraryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-full w-fit font-medium">
          <Info className="w-3.5 h-3.5" />
          現在のプラン（無料版）では、アップロードから90日後にファイルが自動消去されます。
        </div>
      </div>
    </div>
  );
}
