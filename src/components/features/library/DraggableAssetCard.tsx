"use client";

import { ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Check, GripVertical, Loader2, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { AssetFile } from "./types";

interface DraggableAssetCardProps {
  file: AssetFile;
  isSelected: boolean;
  locale: string;
  assigning: boolean;
  selectAssetLabel: string;
  deselectAssetLabel: string;
  linkedCampaignsLabel: string;
  noneLabel: string;
  unassignedLabel: string;
  assignToCampaignLabel: string;
  formatSize: (bytes: number) => string;
  getFileIcon: (type: string) => ReactNode;
  onToggleSelection: (fileId: string) => void;
  onPreview: (file: AssetFile) => void;
  onOpenAssign: (fileId: string) => void;
}

export function DraggableAssetCard({
  file,
  isSelected,
  locale,
  assigning,
  selectAssetLabel,
  deselectAssetLabel,
  linkedCampaignsLabel,
  noneLabel,
  unassignedLabel,
  assignToCampaignLabel,
  formatSize,
  getFileIcon,
  onToggleSelection,
  onPreview,
  onOpenAssign,
  onRename,
}: DraggableAssetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(file.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(file.name);
  };

  const handleSave = async () => {
    if (editValue.trim() && editValue !== file.name && onRename) {
      setIsRenaming(true);
      try {
        await onRename(file.id, editValue.trim());
      } finally {
        setIsRenaming(false);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setIsEditing(false);
  };
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-file-${file.id}`,
    data: { fileId: file.id },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <GlassCard
      ref={setNodeRef}
      style={style}
      className={`relative group hover:border-emerald-500/50 transition-colors flex flex-col h-full cursor-pointer ${
        isSelected ? "border-emerald-500" : ""
      } ${isDragging ? "opacity-50" : ""}`}
      onClick={() => onPreview(file)}
    >
      <div className="flex justify-between items-start mb-4">
        <button
          type="button"
          aria-label={isSelected ? deselectAssetLabel : selectAssetLabel}
          className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
            isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-border hover:border-emerald-500"
          }`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelection(file.id);
          }}
        >
          {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
        </button>
        <button
          type="button"
          className="p-2 rounded-md border border-border/60 hover:border-emerald-500/50 text-muted-foreground hover:text-emerald-500"
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
          aria-label="Drag asset"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="p-3 bg-muted rounded-xl flex items-center justify-center">{getFileIcon(file.type)}</div>
      </div>

      <div className="flex-1">
        {isEditing ? (
          <div className="mb-2" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="w-full text-sm font-semibold bg-background border-2 border-emerald-500 rounded px-1 py-0.5 focus:outline-none"
              disabled={isRenaming}
            />
          </div>
        ) : (
          <div className="group/title flex items-start justify-between mb-1 min-h-[1.5rem]">
            <h3 
              className="font-semibold text-sm line-clamp-2 hover:text-emerald-600 transition-colors cursor-text flex-1" 
              title={file.name}
              onClick={handleStartEdit}
            >
              {file.name}
            </h3>
            <button
              onClick={handleStartEdit}
              className="opacity-0 group-hover/title:opacity-100 p-1 hover:bg-emerald-50 rounded text-muted-foreground hover:text-emerald-500 transition-all"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground mb-3">
          <span>{formatSize(file.size)}</span>
          <span>{new Date(file.createdAt).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US")}</span>
        </div>

        {file.linkedCampaigns.length === 0 ? (
          <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500 mb-3">
            {unassignedLabel}
          </span>
        ) : null}

        <div className="pt-3 border-t border-border/50">
          <p className="text-xs font-semibold mb-1 text-emerald-500/80">{linkedCampaignsLabel}</p>
          {file.linkedCampaigns.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {file.linkedCampaigns.map((c, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full inline-block"
                >
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{noneLabel}</span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          disabled={assigning}
          onClick={(event) => {
            event.stopPropagation();
            onOpenAssign(file.id);
          }}
        >
          {assigning ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
          {assignToCampaignLabel}
        </Button>
      </div>
    </GlassCard>
  );
}
