"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  SensorDescriptor,
  SensorOptions,
} from "@dnd-kit/core";
import { Layers, GripVertical, FolderOpen, Trash2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";
import { StackedDragOverlay } from "@/components/shared/dnd/StackedDragOverlay";
import { DraggableAssetCard } from "@/components/features/library/DraggableAssetCard";
import { CompactAssetCard } from "@/components/features/library/CompactAssetCard";
import { CampaignDockItem } from "@/components/features/library/CampaignDockItem";
import { CampaignSearchDropZone } from "@/components/features/library/CampaignSearchDropZone";
import { AssetFile, CampaignSummary } from "@/components/features/library/types";

interface LibraryGridProps {
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  files: AssetFile[];
  filteredFiles: AssetFile[];
  campaigns: CampaignSummary[];
  recentCampaigns: CampaignSummary[];
  selectedFileIds: Set<string>;
  draggedFileIds: string[];
  assigningCampaignIds: Set<string>;
  pulsedCampaignId: string | null;
  unassignedCount: number;
  locale: string;
  sensors: SensorDescriptor<SensorOptions>[];
  viewMode: "detail" | "compact";
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onToggleSelection: (fileId: string) => void;
  onPreview: (file: AssetFile) => void;
  onOpenAssign: (fileId: string) => void;
  onRename: (fileId: string, newName: string) => Promise<void>;
  onRemove: (fileId: string) => Promise<void>;
  onRequestBulkRemove: () => void;
  onSelectMultiple: (fileIds: string[]) => void;
  onAssignSelected: (campaignId: string) => void;
  onOpenCommandDrop: () => void;
  labels: {
    noFilesTitle: string;
    noFilesDescription: string;
    selectAsset: string;
    deselectAsset: string;
    linkedCampaigns: string;
    none: string;
    unassigned: string;
    assignToCampaign: string;
    draggingAssets: string;
    campaignDock: string;
    selectedAssets: string;
    unassignedCount: string;
    assignSelectedHint: string;
    noCampaignsFound: string;
    noFilteredFiles: string;
    dropToSearch: string;
    dropToSearchHint: string;
  };
  formatSize: (bytes: number) => string;
  getFileIcon: (type: string) => React.ReactNode;
}

function LibraryLoadMoreSentinel({
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  const { ref, inView } = useInView({ rootMargin: "320px" });

  useEffect(() => {
    if (inView && hasMore && !loadingMore) {
      onLoadMore();
    }
  }, [inView, hasMore, loadingMore, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div
      ref={ref}
      className="flex h-12 items-center justify-center text-muted-foreground"
      aria-hidden={!loadingMore}
    >
      {loadingMore ? <Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> : null}
    </div>
  );
}

function LibraryGridSkeleton({ viewMode }: { viewMode: "detail" | "compact" }) {
  const count = viewMode === "compact" ? 12 : 8;
  return (
    <div
      className={cn(
        "grid gap-4 md:gap-6",
        viewMode === "compact"
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}
      aria-busy="true"
      aria-label="Loading assets"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-xl border border-border/40 bg-muted/30 animate-pulse",
            viewMode === "compact" ? "aspect-square" : "h-[320px]"
          )}
        />
      ))}
    </div>
  );
}

export function LibraryGrid({
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  files,
  filteredFiles,
  campaigns,
  recentCampaigns,
  selectedFileIds,
  draggedFileIds,
  assigningCampaignIds,
  pulsedCampaignId,
  unassignedCount,
  locale,
  sensors,
  viewMode,
  onDragStart,
  onDragEnd,
  onToggleSelection,
  onPreview,
  onOpenAssign,
  onRename,
  onRemove,
  onRequestBulkRemove,
  onSelectMultiple,
  onAssignSelected,
  onOpenCommandDrop,
  labels,
  formatSize,
  getFileIcon,
}: LibraryGridProps) {
  const isIntentDockOpen = draggedFileIds.length > 0;
  const selectedCount = selectedFileIds.size;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [columnCount, setColumnCount] = useState(1);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [itemRects, setItemRects] = useState<
    { id: string; rect: { left: number; top: number; right: number; bottom: number } }[]
  >([]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // D&D or existing button clicks should not start marquee
    if ((e.target as HTMLElement).closest("[data-file-id]") || (e.target as HTMLElement).closest("button")) return;
    
    const container = scrollRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.scrollLeft;
    const y = e.clientY - rect.top + container.scrollTop;

    setSelectionBox({ startX: x, startY: y, endX: x, endY: y });

    // Cache current visible items
    const items = container.querySelectorAll("[data-file-id]");
    const rects: { id: string; rect: { left: number; top: number; right: number; bottom: number } }[] = [];
    
    items.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const id = htmlEl.getAttribute("data-file-id");
      if (id) {
        // We need coordinates relative to the scrollable content
        const left = htmlEl.offsetLeft;
        const top = htmlEl.offsetTop;
        
        const row = htmlEl.closest('[style*="translateY"]');
        let absoluteTop = top;
        if (row instanceof HTMLElement) {
          const match = row.style.transform.match(/translateY\((\d+)px\)/);
          if (match) absoluteTop += parseInt(match[1], 10);
        }

        rects.push({ 
          id, 
          rect: { 
            left, 
            top: absoluteTop, 
            right: left + htmlEl.offsetWidth, 
            bottom: absoluteTop + htmlEl.offsetHeight 
          } 
        });
      }
    });
    setItemRects(rects);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectionBox || !scrollRef.current) return;

    const container = scrollRef.current;
    const containerRect = container.getBoundingClientRect();
    const currentX = e.clientX - containerRect.left + container.scrollLeft;
    const currentY = e.clientY - containerRect.top + container.scrollTop;

    setSelectionBox(prev => prev ? { ...prev, endX: currentX, endY: currentY } : null);

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

    onSelectMultiple(selectedIds);
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

  useEffect(() => {
    const updateColumns = () => {
      const width = scrollRef.current?.clientWidth ?? window.innerWidth;
      if (viewMode === "compact") {
        if (width >= 1280) setColumnCount(8);
        else if (width >= 1024) setColumnCount(6);
        else if (width >= 768) setColumnCount(4);
        else if (width >= 480) setColumnCount(3);
        else setColumnCount(2);
      } else {
        if (width >= 1280) setColumnCount(4);
        else if (width >= 1024) setColumnCount(3);
        else if (width >= 768) setColumnCount(2);
        else setColumnCount(1);
      }
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [viewMode]);

  const rowCount = Math.ceil(filteredFiles.length / columnCount);
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => viewMode === "compact" ? 200 : 360,
    overscan: 4,
  });
  const dockCampaigns = (recentCampaigns.length > 0 ? recentCampaigns : campaigns).slice(0, 5);

  if (loading && files.length === 0) {
    return <LibraryGridSkeleton viewMode={viewMode} />;
  }

  if (!loading && files.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{labels.noFilesTitle}</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          {labels.noFilesDescription}
        </p>
      </GlassCard>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div 
        ref={scrollRef} 
        key={viewMode}
        className="h-[68vh] overflow-auto pr-1 relative select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {boxStyles && (
          <div 
            className="absolute z-50 bg-emerald-500/20 border border-emerald-500/50 pointer-events-none rounded-sm"
            style={boxStyles}
          />
        )}
        {filteredFiles.length === 0 ? (
          <GlassCard className="text-center py-16">
            <p className="text-sm text-muted-foreground">{labels.noFilteredFiles}</p>
          </GlassCard>
        ) : (
          <div
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowStartIndex = virtualRow.index * columnCount;
              const rowItems = filteredFiles.slice(rowStartIndex, rowStartIndex + columnCount);
              return (
                <div
                  key={virtualRow.key}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  className="absolute left-0 top-0 w-full px-1"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    className={cn("grid", viewMode === "compact" ? "gap-4" : "gap-6")}
                    style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
                  >
                    {rowItems.map((file) => (
                      viewMode === "compact" ? (
                        <CompactAssetCard
                          key={file.id}
                          file={file}
                          isSelected={selectedFileIds.has(file.id)}
                          onToggleSelection={onToggleSelection}
                          onPreview={onPreview}
                          onRename={onRename}
                          onRemove={(id) => onRemove(id)}
                          getFileIcon={getFileIcon}
                        />
                      ) : (
                        <DraggableAssetCard
                          key={file.id}
                          file={file}
                          isSelected={selectedFileIds.has(file.id)}
                          locale={locale}
                          assigning={assigningCampaignIds.size > 0}
                          selectAssetLabel={labels.selectAsset}
                          deselectAssetLabel={labels.deselectAsset}
                          linkedCampaignsLabel={labels.linkedCampaigns}
                          noneLabel={labels.none}
                          unassignedLabel={labels.unassigned}
                          assignToCampaignLabel={labels.assignToCampaign}
                          formatSize={formatSize}
                          getFileIcon={getFileIcon}
                          onToggleSelection={onToggleSelection}
                          onPreview={onPreview}
                          onOpenAssign={onOpenAssign}
                          onRename={onRename}
                          onRemove={onRemove}
                        />
                      )
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {onLoadMore ? (
          <LibraryLoadMoreSentinel
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={onLoadMore}
          />
        ) : null}
      </div>

      <DragOverlay>
        {draggedFileIds.length > 0 ? (
          draggedFileIds.length > 1 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              <StackedDragOverlay
                label={labels.draggingAssets.replace("{count}", String(draggedFileIds.length))}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="p-3 rounded-lg border border-emerald-500 bg-background/95 shadow-xl flex items-center space-x-2"
            >
              <GripVertical className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">
                {files.find((file) => file.id === draggedFileIds[0])?.name ?? "Asset"}
              </span>
            </motion.div>
          )
        ) : null}
      </DragOverlay>

      <AnimatePresence>
        {isIntentDockOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 14, scale: 0.96, filter: "blur(6px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.95 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(980px,calc(100vw-1rem))]"
          >
            <motion.div
              initial={{ borderRadius: 999 }}
              animate={{ borderRadius: 16 }}
              exit={{ borderRadius: 999 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="rounded-2xl border border-border/70 bg-background/85 backdrop-blur-xl shadow-2xl px-4 py-3"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center text-sm">
                  <Layers className="w-4 h-4 mr-2 text-emerald-500" />
                  {labels.campaignDock}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {labels.selectedAssets.replace("{count}", String(selectedCount))}
                  </span>
                  {selectedCount > 0 && (
                    <button
                      onClick={() => onRequestBulkRemove()}
                      className="p-1.5 hover:bg-red-50 rounded-md text-muted-foreground hover:text-red-500 transition-all"
                      title="選択したファイルを一括削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-3 text-xs text-muted-foreground">
                {labels.unassignedCount.replace("{count}", String(unassignedCount))}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {dockCampaigns.map((campaign) => (
                  <CampaignDockItem
                    key={campaign.id}
                    campaign={campaign}
                    compact
                    disabled={selectedCount === 0 && draggedFileIds.length === 0}
                    assigning={assigningCampaignIds.has(campaign.id)}
                    successPulse={pulsedCampaignId === campaign.id}
                    assignSelectedHint={labels.assignSelectedHint}
                    onAssign={() => onAssignSelected(campaign.id)}
                  />
                ))}
                <CampaignSearchDropZone
                  disabled={selectedCount === 0 && draggedFileIds.length === 0}
                  onClick={onOpenCommandDrop}
                  title={labels.dropToSearch}
                  hint={labels.dropToSearchHint}
                />
                {campaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{labels.noCampaignsFound}</p>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="rounded-full border border-border/70 bg-background/85 backdrop-blur-xl shadow-lg px-4 py-2 text-xs text-muted-foreground flex items-center">
              <Layers className="w-3.5 h-3.5 mr-2 text-emerald-500" />
              {labels.campaignDock}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DndContext>
  );
}
