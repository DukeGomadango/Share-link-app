"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Check, FileImage, FileAudio, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LibraryFile } from "./types";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LibrarySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  libraryFiles: LibraryFile[];
  /** すでに対象キャンペーンに追加済みのアセットID（ライブラリID） */
  assignedAssetIds?: string[];
  /** 選択されたライブラリアセット ID でサーバーにアサインする */
  onAssignSelected: (libraryAssetIds: string[]) => void | Promise<void>;
}

export function LibrarySelectModal({
  isOpen,
  onClose,
  libraryFiles,
  assignedAssetIds = [],
  onAssignSelected,
}: LibrarySelectModalProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  const handleAdd = async () => {
    const ids = libraryFiles.filter((f) => selectedIds.has(f.id)).map((f) => f.id);
    try {
      await onAssignSelected(ids);
    } finally {
      handleClose();
    }
  };

  const toggleSelection = (id: string) => {
    if (assignedAssetIds.includes(id)) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl glass p-6 rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-border/50">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 rounded-full text-muted-foreground hover:bg-muted"
          onClick={handleClose}
        >
          <X className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold mb-1">{t.campaigns.selectFromLibrary}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t.campaigns.selectFromLibraryDescription}
        </p>

        <div className="scrollbar-prominent flex-1 overflow-y-auto mb-6 min-h-[300px] pr-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {libraryFiles.map((file) => {
              const isSelected = selectedIds.has(file.id);
              const isAlreadyAdded = assignedAssetIds.includes(file.id);
              const isImage = file.type.startsWith("image/");
              
              return (
                <div
                  key={file.id}
                  className={cn(
                    "p-2 rounded-xl border bg-background/50 cursor-pointer transition-all flex flex-col relative select-none group",
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/20"
                      : isAlreadyAdded
                      ? "border-border/30 bg-muted/20 opacity-70 cursor-default"
                      : "border-border/50 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                  )}
                  onClick={() => !isAlreadyAdded && toggleSelection(file.id)}
                >
                  {/* Status Indicator */}
                  <div className={cn(
                    "absolute top-2 right-2 z-10 w-5 h-5 rounded-md flex items-center justify-center transition-all",
                    isSelected 
                      ? "bg-emerald-500 text-white shadow-sm" 
                      : isAlreadyAdded
                      ? "bg-muted text-muted-foreground"
                      : "border border-border bg-background/80 opacity-0 group-hover:opacity-100"
                  )}>
                    {isSelected && <Check className="w-3 h-3" />}
                    {isAlreadyAdded && <Check className="w-3 h-3 opacity-50" />}
                  </div>

                  <div className="bg-muted/30 rounded-lg shrink-0 relative overflow-hidden flex items-center justify-center w-full aspect-square mb-2">
                    {isImage ? (
                      <Image 
                        src={file.url} 
                        alt={file.name} 
                        fill 
                        className={cn(
                          "object-cover transition-transform duration-300",
                          !isAlreadyAdded && "group-hover:scale-110",
                          isAlreadyAdded && "filter grayscale-[0.3]"
                        )} 
                        unoptimized 
                      />
                    ) : file.type.startsWith("audio/") ? (
                      <FileAudio className={cn("w-8 h-8", isAlreadyAdded ? "text-muted-foreground" : "text-emerald-500")} />
                    ) : (
                      <File className="w-8 h-8 text-muted-foreground" />
                    )}

                    {/* Added Overlay */}
                    {isAlreadyAdded && (
                      <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[10px] font-bold bg-muted-foreground/80 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          追加済み
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-1">
                    <p className={cn(
                      "text-[10px] font-medium text-center line-clamp-2 w-full leading-tight transition-colors",
                      isAlreadyAdded ? "text-muted-foreground" : "text-foreground/80 group-hover:text-foreground"
                    )}>
                      {file.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end space-x-3 shrink-0 pt-4 border-t border-border/50">
          <Button variant="outline" className="glass" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button
            className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
            disabled={selectedIds.size === 0}
            onClick={handleAdd}
          >
            {t.campaigns.addCountFiles.replace("{count}", selectedIds.size.toString())}
          </Button>
        </div>
      </div>
    </div>
  );
}
