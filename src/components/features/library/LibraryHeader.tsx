"use client";

import { Info } from "lucide-react";

interface LibraryHeaderProps {
  title: string;
  subtitle: string;
}

export function LibraryHeader({ title, subtitle }: LibraryHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-1 hidden text-muted-foreground sm:block">{subtitle}</p>
        <div className="mt-2 flex w-fit items-center gap-2 rounded-full border border-amber-500/10 bg-amber-500/5 px-3 py-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 md:mt-4">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">
            現在のプラン（無料版）では、アップロードから90日後にファイルが自動消去されます。
          </span>
          <span className="sm:hidden">無料プラン: 90日で自動消去</span>
        </div>
      </div>
    </div>
  );
}
