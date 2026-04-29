"use client";

import { FileAudio, FolderOpen } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { DraggableFileItem } from "@/components/features/campaigns/DraggableFileItem";
import { FileItem } from "@/components/features/campaigns/types";

interface FilePoolSectionProps {
  files: FileItem[];
  selectedFileIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onFilesDropped: (files: File[]) => void;
  onOpenLibrary: () => void;
}

export function FilePoolSection({
  files,
  selectedFileIds,
  onToggleSelection,
  onFilesDropped,
  onOpenLibrary,
}: FilePoolSectionProps) {
  return (
    <GlassCard className="flex flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50 shrink-0">
        <h2 className="text-lg font-semibold flex items-center">
          <FileAudio className="w-5 h-5 mr-2 text-emerald-500" />
          File Pool
        </h2>
        <span className="text-xs bg-muted px-2 py-1 rounded-full">{files.length} items</span>
      </div>

      <div className="overflow-y-auto flex-1 pr-2 space-y-3 pb-20">
        {files.map(file => (
          <DraggableFileItem
            key={file.id}
            file={file}
            isSelected={selectedFileIds.has(file.id)}
            onToggleSelection={onToggleSelection}
          />
        ))}

        <div className="flex gap-4 pt-4 border-t border-dashed border-border mt-6">
          <div className="flex-1">
            <FileDropzone onFilesDropped={onFilesDropped} />
          </div>
          <div
            className="flex-1 border-2 border-dashed border-border/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5"
            onClick={onOpenLibrary}
          >
            <FolderOpen className="w-10 h-10 mb-2 text-emerald-500" />
            <p className="text-sm font-medium text-foreground">Add from Library</p>
            <p className="text-xs text-muted-foreground mt-1 text-center">Select existing assets</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
