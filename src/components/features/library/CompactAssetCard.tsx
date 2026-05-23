"use client";

import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { Check, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect, ReactNode } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";
import { useAssetSignedUrl } from "@/hooks/useAssetSignedUrl";
import { AssetFile } from "./types";

interface CompactAssetCardProps {
  file: AssetFile;
  isSelected: boolean;
  onToggleSelection: (fileId: string) => void;
  onPreview: (file: AssetFile) => void;
  onRename?: (fileId: string, newName: string) => Promise<void>;
  onRemove?: (fileId: string) => void;
  getFileIcon: (type: string) => ReactNode;
}

export function CompactAssetCard({
  file,
  isSelected,
  onToggleSelection,
  onPreview,
  onRename,
  onRemove,
  getFileIcon,
}: CompactAssetCardProps) {
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

  const isImage = file.type.startsWith("image/");
  const { url: thumbUrl } = useAssetSignedUrl(file.id, isImage, "preview");
  const imageSrc = thumbUrl || file.url;

  return (
    <GlassCard
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group hover:border-emerald-500/50 transition-all duration-300 flex flex-col cursor-pointer shadow-sm hover:shadow-md p-2",
        isSelected ? "border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-500/5" : "border-border/50",
        isDragging ? "opacity-50" : ""
      )}
      onClick={() => onPreview(file)}
      data-file-id={file.id}
    >
      {/* Checkbox and Drag Handle - Visible on Hover or when Selected */}
      <div className={cn(
        "absolute top-1.5 left-1.5 z-10 flex gap-1 transition-opacity duration-200",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <button
          type="button"
          className={cn(
            "w-5 h-5 rounded border flex items-center justify-center transition-all",
            isSelected 
              ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" 
              : "border-border bg-background/80 hover:border-emerald-500"
          )}
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelection(file.id);
          }}
        >
          {isSelected ? <Check className="w-3 h-3" /> : null}
        </button>
        <button
          type="button"
          className="w-5 h-5 rounded border border-border bg-background/80 text-muted-foreground hover:text-emerald-500 transition-all flex items-center justify-center"
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3 h-3" />
        </button>
      </div>

      {/* Action Buttons - Visible on Hover */}
      <div className="absolute top-1.5 right-1.5 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleStartEdit}
          className="w-5 h-5 bg-background/80 border border-border hover:bg-emerald-50 rounded text-muted-foreground hover:text-emerald-500 transition-all flex items-center justify-center"
        >
          <Pencil className="w-3 h-3" />
        </button>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(file.id);
            }}
            className="w-5 h-5 bg-background/80 border border-border hover:bg-red-50 rounded text-muted-foreground hover:text-red-500 transition-all flex items-center justify-center"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Thumbnail Area */}
      <div className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden relative mb-1.5 shadow-inner group-hover:shadow-none transition-shadow">
        {isImage && imageSrc ? (
          <Image 
            src={imageSrc} 
            alt={file.name} 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-110" 
            unoptimized 
          />
        ) : isImage ? (
          <div className="w-full h-full bg-muted/40 animate-pulse" />
        ) : (
          <div className="transform group-hover:scale-110 transition-transform duration-500 scale-75">
            {getFileIcon(file.type)}
          </div>
        )}
      </div>

      {/* Filename Area */}
      <div className="px-0.5 min-h-[2.25rem] flex flex-col justify-center">
        {isEditing ? (
          <div onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="w-full text-[11px] font-medium bg-background border border-emerald-500 rounded px-1 py-0.5 focus:outline-none"
              disabled={isRenaming}
            />
          </div>
        ) : (
          <p 
            className="text-[11px] font-medium line-clamp-2 group-hover:text-emerald-600 transition-colors text-center leading-tight" 
            title={file.name}
          >
            {file.name}
          </p>
        )}
      </div>
      
      {/* Unassigned Indicator */}
      {file.linkedCampaigns.length === 0 && (
        <div className="absolute bottom-1 right-1">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
        </div>
      )}
    </GlassCard>
  );
}
