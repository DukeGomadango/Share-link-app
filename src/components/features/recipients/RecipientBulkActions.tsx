"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag as TagIcon, Trash2, Plus } from "lucide-react";

interface RecipientBulkActionsProps {
  selectedCount: number;
  onBulkAddTags: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

export function RecipientBulkActions({
  selectedCount,
  onBulkAddTags,
  onDeleteSelected,
  onClearSelection,
}: RecipientBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50 flex justify-center px-3 duration-300 animate-in fade-in slide-in-from-bottom-4 lg:bottom-8"
      role="region"
      aria-label="一括操作"
    >
      <div className="flex w-full max-w-lg flex-col gap-3 rounded-2xl bg-foreground p-4 text-background shadow-2xl sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <div className="flex items-center gap-2">
            <Badge className="flex h-7 w-7 items-center justify-center rounded-full border-none bg-emerald-500 p-0 text-white">
              {selectedCount}
            </Badge>
            <span className="text-sm font-medium">個を選択中</span>
          </div>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full text-background/50 hover:text-background sm:hidden"
            onClick={onClearSelection}
            aria-label="選択を解除"
          >
            <Plus className="h-4 w-4 rotate-45" />
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            size="touch"
            className="w-full text-background hover:bg-background/10 sm:w-auto"
            onClick={onBulkAddTags}
          >
            <TagIcon className="mr-2 h-4 w-4" />
            タグを一括変更
          </Button>
          <Button
            variant="ghost"
            size="touch"
            className="w-full text-destructive-foreground hover:bg-destructive/20 sm:w-auto"
            onClick={onDeleteSelected}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
        </div>

        <button
          type="button"
          className="ml-auto hidden size-11 items-center justify-center rounded-full text-background/50 hover:text-background sm:flex"
          onClick={onClearSelection}
          aria-label="選択を解除"
        >
          <Plus className="h-4 w-4 rotate-45" />
        </button>
      </div>
    </div>
  );
}
