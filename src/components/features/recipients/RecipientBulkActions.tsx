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
  onClearSelection 
}: RecipientBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-foreground text-background px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 min-w-[400px]">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500 text-white border-none h-6 w-6 flex items-center justify-center p-0 rounded-full">
            {selectedCount}
          </Badge>
          <span className="text-sm font-medium">個を選択中</span>
        </div>
        
        <div className="h-6 w-px bg-background/20" />
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-background hover:bg-background/10"
            onClick={onBulkAddTags}
          >
            <TagIcon className="w-4 h-4 mr-2" />
            タグを一括変更
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive-foreground hover:bg-destructive/20"
            onClick={onDeleteSelected}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            削除
          </Button>
        </div>
        
        <button 
          className="ml-auto text-background/50 hover:text-background p-1"
          onClick={onClearSelection}
          aria-label="選択を解除"
        >
          <Plus className="w-4 h-4 rotate-45" />
        </button>
      </div>
    </div>
  );
}
