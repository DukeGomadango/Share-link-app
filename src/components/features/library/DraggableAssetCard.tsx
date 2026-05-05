"use client";

import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { Check, GripVertical, Loader2, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  onRename?: (fileId: string, newName: string) => Promise<void>;
  onRemove?: (fileId: string) => Promise<void>;
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
  onRemove,
}: DraggableAssetCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(file.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
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

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      if (onRemove) {
        await onRemove(file.id);
      }
      setIsConfirmOpen(false);
    } catch (err: any) {
      toast.error(err.message || "削除に失敗しました。");
    } finally {
      setIsRemoving(false);
    }
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-file-${file.id}`,
    data: { fileId: file.id },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const isImage = file.type.startsWith("image/");

  return (
    <>
      <GlassCard
        ref={setNodeRef}
        style={style}
        className={cn(
          "relative group hover:border-emerald-500/50 transition-all duration-300 flex flex-col h-full cursor-pointer shadow-sm hover:shadow-md",
          isSelected ? "border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-500/5" : "border-border/50",
          isDragging ? "opacity-50" : ""
        )}
        onClick={() => onPreview(file)}
        data-file-id={file.id}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
            <button
              type="button"
              aria-label={isSelected ? deselectAssetLabel : selectAssetLabel}
              className={cn(
                "w-6 h-6 rounded border flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" 
                  : "border-border bg-background/50 hover:border-emerald-500 hover:bg-emerald-500/5"
              )}
              onClick={(event) => {
                event.stopPropagation();
                onToggleSelection(file.id);
              }}
            >
              {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
            </button>
            <button
              type="button"
              className="p-1 rounded-md border border-border/60 hover:border-emerald-500/50 text-muted-foreground hover:text-emerald-500 transition-all bg-background/50"
              onClick={(event) => event.stopPropagation()}
              {...attributes}
              {...listeners}
              aria-label="Drag asset"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="w-16 h-16 bg-muted/50 rounded-xl flex items-center justify-center overflow-hidden relative shrink-0 shadow-inner group-hover:shadow-none transition-shadow">
            {isImage ? (
              <Image 
                src={file.url} 
                alt={file.name} 
                fill 
                className="object-cover transition-transform duration-500 group-hover:scale-110" 
                unoptimized 
              />
            ) : (
              <div className="transform group-hover:scale-110 transition-transform duration-500">
                {getFileIcon(file.type)}
              </div>
            )}
          </div>
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
                className="w-full text-sm font-semibold bg-background border-2 border-emerald-500 rounded px-2 py-1 focus:outline-none shadow-sm"
                disabled={isRenaming}
              />
            </div>
          ) : (
            <div className="group/title flex items-start justify-between mb-1 min-h-[1.5rem]">
              <h3 
                className="font-bold text-sm line-clamp-2 hover:text-emerald-600 transition-colors cursor-text flex-1 pr-2" 
                title={file.name}
                onClick={handleStartEdit}
              >
                {file.name}
              </h3>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleStartEdit}
                  className="p-1.5 hover:bg-emerald-50 rounded-md text-muted-foreground hover:text-emerald-500 transition-all"
                  title="Rename"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {onRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConfirmOpen(true);
                    }}
                    className="p-1.5 hover:bg-red-50 rounded-md text-muted-foreground hover:text-red-500 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col mb-3 space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{formatSize(file.size)}</span>
              <span>{new Date(file.createdAt).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US")}</span>
            </div>
            
            {file.expiresAt && (() => {
              const totalDays = 90; // 基本の保持期間
              const diffMs = new Date(file.expiresAt).getTime() - new Date().getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              const progress = Math.max(0, Math.min(100, (diffDays / totalDays) * 100));
              
              const colorClass = 
                diffDays <= 7 ? "bg-red-500" : 
                diffDays <= 30 ? "bg-amber-500" : 
                "bg-emerald-500";
              const textClass = 
                diffDays <= 7 ? "text-red-500 font-bold" : 
                diffDays <= 30 ? "text-amber-500 font-bold" : 
                "text-emerald-500/80";

              return (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-muted-foreground/70 uppercase tracking-tighter">Retention</span>
                    <span className={cn("text-[10px]", textClass)}>
                      {diffDays <= 0 ? "Expired" : diffDays === 1 ? "Last day" : `あと ${diffDays}日`}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", colorClass)}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })()}
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

      <Dialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} className="max-w-md">
        <div onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>ファイルを削除しますか？</DialogTitle>
            <DialogDescription>
              「{file.name}」をライブラリから完全に削除します。この操作は取り消せません。
              {file.linkedCampaigns.length > 0 && (
                <span className="block mt-4 text-red-500 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                  注意: このファイルは現在キャンペーンに使用されているため、削除するには先にキャンペーンからの紐付けを解除する必要があります。
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)} disabled={isRemoving}>
              キャンセル
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemove} 
              disabled={isRemoving || file.linkedCampaigns.length > 0}
              className={cn(
                "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20",
                file.linkedCampaigns.length > 0 && "opacity-50 cursor-not-allowed grayscale-[0.5]"
              )}
            >
              {isRemoving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              削除する
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
