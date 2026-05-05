import { useDraggable } from "@dnd-kit/core";
import Image from "next/image";
import { Check, FileAudio, FileImage, File, Trash2 } from "lucide-react";
import { FileItem } from "./types";
import { cn } from "@/lib/utils";

interface DraggableFileItemProps {
  file: FileItem;
  isSelected: boolean;
  onToggleSelection: (fileId: string) => void;
  onRemove?: () => void;
  priority?: boolean;
}

export function DraggableFileItem({ file, isSelected, onToggleSelection, onRemove, priority = false }: DraggableFileItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `file-${file.id}`,
    data: { file },
  });

  // DragOverlay を使用しているため、オリジナル側は移動（transform）させない。
  // 移動させるとプールのコンテナ幅を広げてしまい、意図しない横スクロールを誘発するため。
  const style = undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-file-id={file.id}
      className={cn(
        "relative rounded-xl border bg-background/50 cursor-grab active:cursor-grabbing hover:border-emerald-500/50 transition-[border-color,background-color,box-shadow] duration-200 group flex flex-col p-2",
        isDragging ? "opacity-20 ring-2 ring-emerald-500/20 z-0" : "border-border/50",
        isSelected ? "border-emerald-500 bg-emerald-500/5" : ""
      )}
      onClick={(event) => {
        event.stopPropagation();
        onToggleSelection(file.id);
      }}
    >
      {/* Checkbox Overlay/Button */}
      <button
        type="button"
        aria-label={isSelected ? "Deselect file" : "Select file"}
        className={cn(
          "z-10 rounded border flex items-center justify-center shrink-0 transition-all absolute top-2 left-2 w-4 h-4",
          isSelected 
            ? "bg-emerald-500 border-emerald-500 text-white" 
            : "border-border hover:border-emerald-500 bg-background/80 opacity-0 group-hover:opacity-100"
        )}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggleSelection(file.id);
        }}
      >
        {isSelected ? <Check className="w-2.5 h-2.5" /> : null}
      </button>

      {/* Remove Button */}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove from campaign"
          className="z-10 absolute top-2 right-2 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      {/* Thumbnail */}
      <div className="bg-emerald-500/10 rounded-lg text-emerald-500 shrink-0 relative overflow-hidden flex items-center justify-center w-full aspect-square mb-2">
        {file.type === "image" && file.previewUrl ? (
          <Image src={file.previewUrl} alt={file.name} fill priority={priority} className="object-cover" unoptimized />
        ) : file.type === "audio" ? (
          <FileAudio className="w-6 h-6" />
        ) : file.type === "image" ? (
          <FileImage className="w-6 h-6" />
        ) : (
          <File className="w-6 h-6" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate text-[10px] text-center">
          {file.name}
        </p>
      </div>
    </div>
  );
}
