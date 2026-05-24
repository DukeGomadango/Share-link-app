"use client";

import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import type { SensorDescriptor, SensorOptions } from "@dnd-kit/core";
import { FileAudio, FileImage, Users } from "lucide-react";
import Image from "next/image";
import { StackedDragOverlay } from "@/components/shared/dnd/StackedDragOverlay";
import { FilePoolSection } from "@/components/features/campaigns/FilePoolSection";
import { RecipientsSection } from "@/components/features/campaigns/RecipientsSection";
import { MobileCampaignAssignHint } from "@/components/features/campaigns/MobileCampaignAssignHint";
import {
  CampaignDetailWorkTabs,
  type CampaignWorkTab,
} from "@/components/features/campaigns/detail/CampaignDetailWorkTabs";
import { useTranslation } from "@/lib/i18n";
import type { FileItem, Recipient } from "@/components/features/campaigns/types";

type CampaignDetailWorkAreaProps = {
  isLgUp: boolean;
  workTab: CampaignWorkTab;
  onWorkTabChange: (tab: CampaignWorkTab) => void;
  workflowLoading: boolean;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  files: FileItem[];
  recipients: Recipient[];
  selectedFileIds: Set<string>;
  toggleSelection: (id: string) => void;
  toggleAllSelection: () => void;
  setSelectedFiles: (ids: string[]) => void;
  handleFilesDropped: (files: File[]) => void;
  onOpenLibrary: () => void;
  handleUnassignFromCampaign: (fileIds: string[]) => void;
  rarities?: { id: string; name: string; color: string }[];
  onUpdateFileRarity?: (fileId: string, rarityId: string | null) => void;
  pulsedRecipientId: string | null;
  onRemoveFile: (recipientId: string, fileId: string) => void;
  onRemoveRecipient: (recipientId: string) => void;
  onMergeRecipients: (sourceId: string, targetId: string) => void;
  onAddRecipients: () => void;
  addRecipientsDisabled: boolean;
  showPoolEmptyHint: boolean;
  isDraft: boolean;
  isPublic: boolean;
  recipientsViewMode: "grid" | "list";
  onRecipientsViewModeChange: (mode: "grid" | "list") => void;
  focusExternalTx: string | null;
  onRequestAssignWizard?: (recipientId: string) => void;
  onPublishForAdd?: () => void;
  activeDragFile: FileItem | null;
  activeDragRecipient: Recipient | null;
  draggedFileIds: string[];
};

export function CampaignDetailWorkArea({
  isLgUp,
  workTab,
  onWorkTabChange,
  workflowLoading,
  sensors,
  onDragStart,
  onDragEnd,
  files,
  recipients,
  selectedFileIds,
  toggleSelection,
  toggleAllSelection,
  setSelectedFiles,
  handleFilesDropped,
  onOpenLibrary,
  handleUnassignFromCampaign,
  rarities,
  onUpdateFileRarity,
  pulsedRecipientId,
  onRemoveFile,
  onRemoveRecipient,
  onMergeRecipients,
  onAddRecipients,
  addRecipientsDisabled,
  showPoolEmptyHint,
  isDraft,
  isPublic,
  recipientsViewMode,
  onRecipientsViewModeChange,
  focusExternalTx,
  onRequestAssignWizard,
  onPublishForAdd,
  activeDragFile,
  activeDragRecipient,
  draggedFileIds,
}: CampaignDetailWorkAreaProps) {
  const { t } = useTranslation();

  const filePool = (
    <FilePoolSection
      layoutMode={isLgUp ? "panel" : "standalone"}
      files={files}
      selectedFileIds={selectedFileIds}
      onToggleSelection={toggleSelection}
      onToggleAllSelection={toggleAllSelection}
      onSelectMultiple={setSelectedFiles}
      onFilesDropped={handleFilesDropped}
      onOpenLibrary={onOpenLibrary}
      onUnassignFiles={handleUnassignFromCampaign}
      rarities={rarities}
      onUpdateFileRarity={onUpdateFileRarity}
    />
  );

  const recipientsPanel = (
    <RecipientsSection
      layoutMode={isLgUp ? "panel" : "standalone"}
      recipients={recipients}
      files={files}
      pulsedRecipientId={pulsedRecipientId}
      onRemoveFile={onRemoveFile}
      onRemoveRecipient={onRemoveRecipient}
      onMerge={onMergeRecipients}
      readOnly={false}
      onAddRecipients={onAddRecipients}
      addRecipientsDisabled={addRecipientsDisabled}
      showPoolEmptyHint={showPoolEmptyHint}
      isDraft={isDraft}
      isPublic={isPublic}
      viewMode={recipientsViewMode}
      onViewModeChange={onRecipientsViewModeChange}
      focusExternalTx={focusExternalTx}
      onRequestAssignWizard={onRequestAssignWizard}
      onPublishForAdd={onPublishForAdd}
    />
  );

  if (workflowLoading) {
    return (
      <div className="min-h-[240px] flex-1 animate-pulse rounded-xl border border-border/50 bg-muted/20 lg:min-h-0" />
    );
  }

  return (
    <>
      {!isLgUp ? <MobileCampaignAssignHint /> : null}

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {isLgUp ? (
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-6">
            {filePool}
            {recipientsPanel}
          </div>
        ) : (
          <>
            <CampaignDetailWorkTabs
              value={workTab}
              onChange={onWorkTabChange}
              fileCount={files.length}
              recipientCount={recipients.length}
            />
            <div className="mt-3 min-h-[min(65dvh,calc(100dvh-14rem))] overflow-hidden">
              {workTab === "files" ? filePool : recipientsPanel}
            </div>
          </>
        )}

        <DragOverlay>
          {activeDragRecipient ? (
            <div className="pointer-events-none flex min-w-[200px] cursor-grabbing rotate-2 scale-105 items-center space-x-3 rounded-2xl border border-sky-500 bg-background/95 p-4 shadow-2xl transition-none">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{activeDragRecipient.name}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Recipient
                </p>
              </div>
            </div>
          ) : activeDragFile ? (
            draggedFileIds.length > 1 ? (
              <StackedDragOverlay
                label={t.campaigns.filesSelected.replace("{count}", draggedFileIds.length.toString())}
              />
            ) : (
              <div className="pointer-events-none flex cursor-grabbing rotate-3 scale-105 items-center space-x-3 rounded-lg border border-emerald-500 bg-background/90 p-3 shadow-2xl transition-none">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-emerald-500/20 p-2 text-emerald-500">
                  {activeDragFile.type === "image" && activeDragFile.previewUrl ? (
                    <Image
                      src={activeDragFile.previewUrl}
                      alt={activeDragFile.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : activeDragFile.type === "audio" ? (
                    <FileAudio className="h-5 w-5" />
                  ) : (
                    <FileImage className="h-5 w-5" />
                  )}
                </div>
                <p className="line-clamp-1 text-sm font-medium">{activeDragFile.name}</p>
              </div>
            )
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
