import { useDraggable } from "@dnd-kit/core";
import { Check, Trash2 } from "lucide-react";
import { CampaignFileThumb } from "./CampaignFileThumb";
import { FileItem } from "./types";
import { cn } from "@/lib/utils";

interface DraggableFileItemProps {
  file: FileItem;
  isSelected: boolean;
  onToggleSelection: (fileId: string) => void;
  onRemove?: () => void;
  priority?: boolean;
  rarities?: { id: string; name: string; color: string }[];
  onUpdateRarity?: (fileId: string, rarityId: string | null) => void;
}

export function DraggableFileItem({
  file,
  isSelected,
  onToggleSelection,
  onRemove,
  priority = false,
  rarities = [],
  onUpdateRarity,
}: DraggableFileItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
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
          "z-10 absolute top-2 left-2 flex size-6 shrink-0 items-center justify-center rounded border transition-all md:size-4",
          isSelected 
            ? "bg-emerald-500 border-emerald-500 text-white" 
            : "border-border hover:border-emerald-500 bg-background/80 opacity-100 md:opacity-0 md:group-hover:opacity-100"
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
          className="z-10 absolute top-2 right-2 flex size-8 items-center justify-center text-muted-foreground transition-all opacity-100 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
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
        <CampaignFileThumb file={file} priority={priority} lazy={!priority} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 flex flex-col items-center">
        <p className="font-medium truncate text-[10px] text-center w-full">
          {file.name}
        </p>
        {file.expiresAt && (
          <p className="text-[8px] text-muted-foreground/60 mt-0.5">
            Expires: {new Date(file.expiresAt).toLocaleDateString()}
          </p>
        )}

        {/* Rarity Selector */}
        {rarities.length > 0 && (
          <div className="mt-2 w-full" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <select
              className="w-full text-[9px] font-bold bg-background/80 border border-border/60 rounded px-1 py-0.5 outline-none focus:border-emerald-500/50"
              value={file.gachaRarityId || ""}
              onChange={(e) => onUpdateRarity?.(file.id, e.target.value || null)}
            >
              <option value="">RARE: --</option>
              {rarities.map((r) => (
                <option key={r.id} value={r.id} style={{ color: r.color }}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
