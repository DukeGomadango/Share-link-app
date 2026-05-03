"use client";

import { useState } from "react";
import { X, Check, FileImage, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LibraryFile } from "./types";
import { useTranslation } from "@/lib/i18n";

interface LibrarySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  libraryFiles: LibraryFile[];
  /** 選択されたライブラリアセット ID でサーバーにアサインする */
  onAssignSelected: (libraryAssetIds: string[]) => void | Promise<void>;
}

export function LibrarySelectModal({
  isOpen,
  onClose,
  libraryFiles,
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
              return (
                <div
                  key={file.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center relative select-none ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 shadow-md transform scale-[1.02]"
                      : "border-border/50 bg-background/50 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                  }`}
                  onClick={() => toggleSelection(file.id)}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <div className="w-14 h-14 bg-muted/50 rounded-full flex items-center justify-center mb-3">
                    {file.type.startsWith("image") ? (
                      <FileImage className="w-7 h-7 text-blue-500" />
                    ) : (
                      <FileAudio className="w-7 h-7 text-emerald-500" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-center line-clamp-2 w-full leading-tight">
                    {file.name}
                  </span>
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
