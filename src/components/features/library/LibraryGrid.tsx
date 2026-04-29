"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DndContext, DragOverlay, SensorDescriptor, SensorOptions } from "@dnd-kit/core";
import { Layers, GripVertical, FolderOpen } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { StackedDragOverlay } from "@/components/shared/dnd/StackedDragOverlay";
import { DraggableAssetCard } from "@/components/features/library/DraggableAssetCard";
import { CampaignDockItem } from "@/components/features/library/CampaignDockItem";
import { AssetFile, CampaignSummary } from "@/components/features/library/types";

interface LibraryGridProps {
  files: AssetFile[];
  filteredFiles: AssetFile[];
  campaigns: CampaignSummary[];
  selectedFileIds: Set<string>;
  draggedFileIds: string[];
  assigningCampaignIds: Set<string>;
  pulsedCampaignId: string | null;
  unassignedCount: number;
  locale: string;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragStart: (event: any) => void;
  onDragEnd: (event: any) => void;
  onToggleSelection: (fileId: string) => void;
  onPreview: (file: AssetFile) => void;
  onOpenAssign: (fileId: string) => void;
  onAssignSelected: (campaignId: string) => void;
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
  };
  formatSize: (bytes: number) => string;
  getFileIcon: (type: string) => React.ReactNode;
}

export function LibraryGrid({
  files,
  filteredFiles,
  campaigns,
  selectedFileIds,
  draggedFileIds,
  assigningCampaignIds,
  pulsedCampaignId,
  unassignedCount,
  locale,
  sensors,
  onDragStart,
  onDragEnd,
  onToggleSelection,
  onPreview,
  onOpenAssign,
  onAssignSelected,
  labels,
  formatSize,
  getFileIcon,
}: LibraryGridProps) {
  const isIntentDockOpen = draggedFileIds.length > 0;
  const selectedCount = selectedFileIds.size;

  if (files.length === 0) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFiles.map((file) => (
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
          />
        ))}
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
                <span className="text-xs text-muted-foreground">
                  {labels.selectedAssets.replace("{count}", String(selectedCount))}
                </span>
              </div>
              <div className="mb-3 text-xs text-muted-foreground">
                {labels.unassignedCount.replace("{count}", String(unassignedCount))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {campaigns.map((campaign) => (
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
