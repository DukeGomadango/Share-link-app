import { useState, useMemo } from "react";
import { FileAudio, FolderOpen, Search, X, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DraggableFileItem } from "@/components/features/campaigns/DraggableFileItem";
import { FileItem } from "@/components/features/campaigns/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface FilePoolSectionProps {
  files: FileItem[];
  selectedFileIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: () => void;
  onSelectMultiple?: (ids: string[]) => void;
  onFilesDropped: (files: File[]) => void;
  onOpenLibrary: () => void;
  onUnassignFiles?: (fileIds: string[]) => void;
  rarities?: { id: string; name: string; color: string }[];
  onUpdateFileRarity?: (fileId: string, rarityId: string | null) => void;
  /** panel: デスクトップ2カラム用の h-full / standalone: モバイルタブ内 */
  layoutMode?: "panel" | "standalone";
}

export function FilePoolSection({
  files,
  selectedFileIds,
  onToggleSelection,
  onToggleAllSelection: _onToggleAllSelection,
  onSelectMultiple,
  onFilesDropped,
  onOpenLibrary,
  onUnassignFiles,
  rarities = [],
  onUpdateFileRarity,
  layoutMode = "panel",
}: FilePoolSectionProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [itemRects, setItemRects] = useState<{ id: string; rect: { left: number; top: number; right: number; bottom: number } }[]>([]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase().trim();
    return files.filter(f => f.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  const isAllSelected = filteredFiles.length > 0 && filteredFiles.every(f => selectedFileIds.has(f.id));
  const selectedInFilterCount = filteredFiles.filter(f => selectedFileIds.has(f.id)).length;
  const isIndeterminate = selectedInFilterCount > 0 && selectedInFilterCount < filteredFiles.length;

  const handleToggleAll = () => {
    // もし現在のフィルター結果がすべて選択済みなら解除、そうでなければすべて選択
    if (isAllSelected) {
      filteredFiles.forEach(f => {
        if (selectedFileIds.has(f.id)) onToggleSelection(f.id);
      });
    } else {
      filteredFiles.forEach(f => {
        if (!selectedFileIds.has(f.id)) onToggleSelection(f.id);
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // アイテム（data-file-id を持つ要素）をクリックした場合は D&D を優先するため、選択を開始しない
    if ((e.target as HTMLElement).closest("[data-file-id]")) return;
    
    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    
    // スクロール量を考慮したコンテナ内相対座標を記録
    const x = e.clientX - rect.left + container.scrollLeft;
    const y = e.clientY - rect.top + container.scrollTop;

    setSelectionBox({ startX: x, startY: y, endX: x, endY: y });

    // 全アイテムの現在位置（コンテナ内相対座標）を取得してキャッシュ
    const items = container.querySelectorAll("[data-file-id]");
    const rects: { id: string; rect: { left: number; top: number; right: number; bottom: number } }[] = [];
    
    items.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const id = htmlEl.getAttribute("data-file-id");
      if (id) {
        // コンテナ（relative）に対する位置を取得
        const left = htmlEl.offsetLeft;
        const top = htmlEl.offsetTop;
        rects.push({ 
          id, 
          rect: { 
            left, 
            top, 
            right: left + htmlEl.offsetWidth, 
            bottom: top + htmlEl.offsetHeight 
          } 
        });
      }
    });
    setItemRects(rects);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectionBox) return;

    const container = e.currentTarget as HTMLDivElement;
    const containerRect = container.getBoundingClientRect();
    const currentX = e.clientX - containerRect.left + container.scrollLeft;
    const currentY = e.clientY - containerRect.top + container.scrollTop;

    setSelectionBox(prev => prev ? { ...prev, endX: currentX, endY: currentY } : null);

    // 選択ボックスの矩形（コンテナ内相対座標）
    const box = {
      left: Math.min(selectionBox.startX, currentX),
      top: Math.min(selectionBox.startY, currentY),
      right: Math.max(selectionBox.startX, currentX),
      bottom: Math.max(selectionBox.startY, currentY)
    };

    const selectedIds = itemRects
      .filter(({ rect }) => {
        return !(
          rect.left > box.right ||
          rect.right < box.left ||
          rect.top > box.bottom ||
          rect.bottom < box.top
        );
      })
      .map(r => r.id);

    if (onSelectMultiple) {
      onSelectMultiple(selectedIds);
    }
  };

  const handleMouseUp = () => {
    setSelectionBox(null);
    setItemRects([]);
  };

  const boxStyles = selectionBox ? {
    left: Math.min(selectionBox.startX, selectionBox.endX),
    top: Math.min(selectionBox.startY, selectionBox.endY),
    width: Math.abs(selectionBox.startX - selectionBox.endX),
    height: Math.abs(selectionBox.startY - selectionBox.endY),
  } : null;

  return (
    <GlassCard
      className={cn(
        "flex flex-col overflow-hidden",
        layoutMode === "panel" ? "h-full" : "h-full min-h-[min(62dvh,560px)]"
      )}
    >
      <div className="space-y-4 mb-4 pb-4 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Checkbox
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onCheckedChange={handleToggleAll}
                aria-label="Select all filtered files"
              />
            </div>
            <h2 className="text-lg font-semibold flex items-center">
              <FileAudio className="w-5 h-5 mr-2 text-emerald-500" />
              {t.campaigns.filePool}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {selectedFileIds.size > 0 && (
              <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] uppercase font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    const libraryIds = files
                      .filter(f => selectedFileIds.has(f.id))
                      .map(f => f.libraryAssetId)
                      .filter(Boolean) as string[];
                    if (confirm(`${selectedFileIds.size} 件のファイルをキャンペーンから外しますか？`)) {
                      onUnassignFiles?.(libraryIds);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  解除 ({selectedFileIds.size})
                </Button>
                <div className="w-px h-3 bg-border/50 mx-1" />
              </div>
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {files.length} {t.claim.items}
            </span>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
          <Input 
            placeholder={t.campaigns.searchPlaceholderFiles} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9 bg-muted/30 border-none rounded-xl focus-visible:ring-emerald-500/30 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div 
        className="scrollbar-prominent overflow-y-auto overflow-x-hidden flex-1 pr-2 pb-20 relative select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Selection Box Overlay */}
        {boxStyles && (
          <div 
            className="absolute z-50 bg-emerald-500/20 border border-emerald-500/50 pointer-events-none rounded-sm"
            style={boxStyles}
          />
        )}

        {filteredFiles.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 opacity-60">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold">{t.campaigns.noFilesFound}</p>
            <p className="text-xs text-muted-foreground">{t.campaigns.tryAnotherSearch}</p>
          </div>
        ) : (
          <div className="grid gap-3 transition-all duration-300 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFiles.map((file, index) => (
              <DraggableFileItem
                key={file.id}
                file={file}
                isSelected={selectedFileIds.has(file.id)}
                onToggleSelection={onToggleSelection}
                onRemove={file.libraryAssetId ? () => {
                  if (confirm(`${file.name} をキャンペーンから外しますか？`)) {
                    onUnassignFiles?.([file.libraryAssetId!]);
                  }
                } : undefined}
                priority={index < 4}
                rarities={rarities}
                onUpdateRarity={onUpdateFileRarity}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-4 pt-4 border-t border-dashed border-border mt-6">
          <div className="flex-1">
            <FileDropzone onFilesDropped={onFilesDropped} />
          </div>
          <div
            className="flex-1 border-2 border-dashed border-border/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5"
            onClick={onOpenLibrary}
          >
            <FolderOpen className="w-10 h-10 mb-2 text-emerald-500" />
            <p className="text-sm font-medium text-foreground">{t.campaigns.addFromLibrary}</p>
            <p className="text-xs text-muted-foreground mt-1 text-center">{t.campaigns.selectExistingAssets}</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
