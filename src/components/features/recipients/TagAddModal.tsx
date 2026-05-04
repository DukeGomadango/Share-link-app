"use client";

import { useState } from "react";
import { Tag, X, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tags: string[]) => void;
  existingTags: string[];
  selectedCount: number;
}

export function TagAddModal({
  isOpen,
  onClose,
  onConfirm,
  existingTags,
  selectedCount,
}: TagAddModalProps) {
  const [tagInput, setTagInput] = useState("");
  const [addedTags, setAddedTags] = useState<string[]>([]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !addedTags.includes(trimmed)) {
      setAddedTags([...addedTags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setAddedTags(addedTags.filter((t) => t !== tag));
  };

  const toggleExistingTag = (tag: string) => {
    if (addedTags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      setAddedTags([...addedTags, tag]);
    }
  };

  const handleConfirm = () => {
    onConfirm(addedTags);
    setAddedTags([]);
    setTagInput("");
    onClose();
  };

  const handleInternalClose = () => {
    setAddedTags([]);
    setTagInput("");
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleInternalClose}>
      <DialogHeader className="space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
          <Tag className="w-6 h-6" />
        </div>
        <DialogTitle>
          タグを一括追加
        </DialogTitle>
        <DialogDescription>
          選択した {selectedCount} 件の受取人に共通のタグを追加します。
        </DialogDescription>
      </DialogHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold ml-1">新しいタグを入力</label>
            <div className="relative flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="例: VIP, 2024春..."
                className="flex-1 rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-all"
              />
              <Button 
                onClick={handleAddTag}
                type="button"
                className="rounded-xl aspect-square p-0 w-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {addedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 min-h-[50px]">
              {addedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 rounded-lg bg-white dark:bg-slate-800 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 gap-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-red-100 hover:text-red-500 rounded-md p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {existingTags.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold ml-1 text-muted-foreground">既存のタグから選ぶ</label>
              <div className="flex flex-wrap gap-2">
                {existingTags.map((tag) => {
                  const isSelected = addedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleExistingTag(tag)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                        isSelected 
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md" 
                          : "bg-muted/50 border-border/50 text-muted-foreground hover:border-emerald-500/50 hover:bg-emerald-500/5"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 mr-1 inline" />}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={handleInternalClose}
            className="flex-1 rounded-2xl h-12 text-muted-foreground hover:bg-muted"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={addedTags.length === 0}
            className="flex-1 rounded-2xl h-12 font-bold bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white transition-all active:scale-95"
          >
            追加する
          </Button>
        </div>
    </Dialog>
  );
}
