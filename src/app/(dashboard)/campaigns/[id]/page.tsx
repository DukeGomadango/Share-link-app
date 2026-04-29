"use client";

import { useParams } from "next/navigation";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { Link as LinkIcon, Download, FileAudio, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import { StackedDragOverlay } from "@/components/shared/dnd/StackedDragOverlay";
import { LibrarySelectModal } from "@/components/features/campaigns/LibrarySelectModal";
import { useCampaignDetail } from "@/hooks/features/campaigns/useCampaignDetail";

// サブコンポーネント
import { FilePoolSection } from "@/components/features/campaigns/FilePoolSection";
import { RecipientsSection } from "@/components/features/campaigns/RecipientsSection";

import { useTranslation } from "@/lib/i18n";

export default function CampaignDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const {
    files,
    recipients,
    activeDragFile,
    draggedFileIds,
    selectedFileIds,
    pulsedRecipientId,
    showLibraryModal,
    setShowLibraryModal,
    libraryFiles,
    sensors,
    fetchLibraryFiles,
    handleRemoveFile,
    toggleSelection,
    handleDragStart,
    handleDragEnd,
    addFilesToPool,
  } = useCampaignDetail();

  const handleFilesDropped = (newFiles: File[]) => {
    const newItems = newFiles.map((f, i) => ({
      id: `f-new-${Date.now()}-${i}`,
      name: f.name,
      type: f.type.startsWith('audio') ? "audio" as const : "image" as const,
      previewUrl: f.type.startsWith('image') ? URL.createObjectURL(f) : undefined
    }));
    addFilesToPool(newItems);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <div className="flex items-center space-x-2 text-sm text-emerald-500 mb-1">
            <span className="uppercase tracking-wider font-semibold text-xs">{t.campaigns.directCampaign}</span>
            <span>•</span>
            <span className="text-muted-foreground">{params.id as string}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t.campaigns.campaignFlow}</h1>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="glass">
            <Download className="w-4 h-4 mr-2" />
            {t.campaigns.exportLinks}
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg">
            <LinkIcon className="w-4 h-4 mr-2" />
            {t.campaigns.generateAll}
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          <FilePoolSection
            files={files}
            selectedFileIds={selectedFileIds}
            onToggleSelection={toggleSelection}
            onFilesDropped={handleFilesDropped}
            onOpenLibrary={() => {
              setShowLibraryModal(true);
              fetchLibraryFiles();
            }}
          />

          <RecipientsSection
            recipients={recipients}
            files={files}
            pulsedRecipientId={pulsedRecipientId}
            onRemoveFile={handleRemoveFile}
          />
        </div>

        <DragOverlay>
          {activeDragFile ? (
            draggedFileIds.length > 1 ? (
              <StackedDragOverlay label={t.campaigns.filesSelected.replace("{count}", draggedFileIds.length.toString())} />
            ) : (
              <div className="p-3 rounded-lg border border-emerald-500 bg-background/90 shadow-2xl flex items-center space-x-3 rotate-3 scale-105 cursor-grabbing">
                <div className="p-2 bg-emerald-500/20 rounded-md text-emerald-500 shrink-0 relative overflow-hidden flex items-center justify-center w-10 h-10">
                  {activeDragFile.type === "image" && activeDragFile.previewUrl ? (
                    <Image src={activeDragFile.previewUrl} alt={activeDragFile.name} fill className="object-cover" unoptimized />
                  ) : activeDragFile.type === "audio" ? (
                    <FileAudio className="w-5 h-5" />
                  ) : (
                    <FileImage className="w-5 h-5" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium line-clamp-1">{activeDragFile.name}</p>
                </div>
              </div>
            )
          ) : null}
        </DragOverlay>
      </DndContext>

      <LibrarySelectModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        libraryFiles={libraryFiles}
        onAddFiles={(newFiles) => addFilesToPool(newFiles)}
      />
    </div>
  );
}
