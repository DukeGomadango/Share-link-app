"use client";

import { Plus } from "lucide-react";

interface StepFileSelectProps {
  t: any;
}

export function StepFileSelect({ t }: StepFileSelectProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-2 text-emerald-500 mb-2">
        <Plus className="w-5 h-5" />
        <h2 className="text-xl font-semibold">{t.campaigns.new.steps.step2}</h2>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
          <Plus className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground max-w-xs">
          現在は作成後に詳細画面からファイルを追加できます。<br/>
          (将来的にここでライブラリ選択が可能になります)
        </p>
      </div>
    </div>
  );
}
