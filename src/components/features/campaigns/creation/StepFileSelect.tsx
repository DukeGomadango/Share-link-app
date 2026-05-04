"use client";

import { Plus, Library, X, Loader2, FileImage, FileAudio, File as FileIcon, Search } from "lucide-react";
import { useState } from "react";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { useLibraryFiles } from "@/hooks/features/library/useLibraryFiles";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface StepFileSelectProps {
  assetIds: string[];
  onUpdate: (data: Partial<{ assetIds: string[] }>) => void;
  t: any;
}

export function StepFileSelect({ assetIds, onUpdate, t }: StepFileSelectProps) {
  const { files, handleFilesDropped, uploadError, searchQuery, setSearchQuery, filteredFiles } = useLibraryFiles();
  const [activeTab, setActiveTab] = useState<"upload" | "library">("upload");
  const [isUploading, setIsUploading] = useState(false);

  const toggleAsset = (assetId: string) => {
    if (assetIds.includes(assetId)) {
      onUpdate({ assetIds: assetIds.filter(id => id !== assetId) });
    } else {
      onUpdate({ assetIds: [...assetIds, assetId] });
    }
  };

  const onDrop = async (droppedFiles: File[]) => {
    setIsUploading(true);
    try {
      const newAssetIds = await handleFilesDropped(droppedFiles);
      if (newAssetIds && newAssetIds.length > 0) {
        onUpdate({ assetIds: [...assetIds, ...newAssetIds] });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="w-6 h-6 text-blue-500" />;
    if (type.startsWith("audio/")) return <FileAudio className="w-6 h-6 text-purple-500" />;
    return <FileIcon className="w-6 h-6 text-gray-500" />;
  };

  const selectedFiles = files.filter(f => assetIds.includes(f.id));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
      <div className="flex items-center space-x-2 text-emerald-500 mb-2">
        <Plus className="w-5 h-5" />
        <h2 className="text-xl font-semibold">{t.campaigns.new.steps.step2}</h2>
      </div>
      
      {/* Tabs */}
      <div className="flex bg-muted/30 p-1 rounded-xl w-fit">
        <button
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "upload" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("upload")}
        >
          <Plus className="w-4 h-4" />
          <span>新規アップロード</span>
        </button>
        <button
          className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "library" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("library")}
        >
          <Library className="w-4 h-4" />
          <span>ライブラリから選択</span>
        </button>
      </div>

      <div className="flex-1 min-h-[300px]">
        {activeTab === "upload" && (
          <div className="h-full flex flex-col">
            {uploadError && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-xl">
                {uploadError}
              </div>
            )}
            {isUploading ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/5 min-h-[250px]">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">アップロード中...</p>
              </div>
            ) : (
              <FileDropzone onFilesDropped={onDrop} className="flex-1 min-h-[250px]" />
            )}
          </div>
        )}

        {activeTab === "library" && (
          <div className="h-full flex flex-col space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ファイル名で検索..."
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredFiles.length === 0 ? (
                <div className="col-span-full py-10 text-center text-muted-foreground text-sm">
                  ファイルが見つかりません
                </div>
              ) : (
                filteredFiles.map(file => {
                  const isSelected = assetIds.includes(file.id);
                  const isImage = file.type.startsWith("image/");
                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleAsset(file.id)}
                      className={cn(
                        "relative flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all hover:border-emerald-500/50",
                        isSelected ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20" : "border-border/50 bg-background/50"
                      )}
                    >
                      <div className="w-12 h-12 mb-2 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden relative">
                        {isImage ? (
                          <Image src={file.url} alt={file.name} fill className="object-cover" unoptimized />
                        ) : (
                          getFileIcon(file.type)
                        )}
                      </div>
                      <p className="text-xs font-medium text-center line-clamp-1 w-full" title={file.name}>
                        {file.name}
                      </p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Plus className="w-3 h-3 text-white rotate-45" /> {/* Use plus rotated as X or just checkmark */}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Assets Tray */}
      <div className="mt-6 pt-6 border-t border-border/30">
        <h3 className="text-sm font-semibold mb-3 flex items-center text-muted-foreground">
          選択中のファイル ({selectedFiles.length})
        </h3>
        {selectedFiles.length === 0 ? (
          <div className="text-xs text-muted-foreground p-4 bg-muted/20 rounded-xl border border-dashed border-border/50 text-center">
            まだファイルが選択されていません
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {selectedFiles.map(file => {
              const isImage = file.type.startsWith("image/");
              return (
                <div key={file.id} className="flex-shrink-0 flex items-center bg-background border border-border/50 rounded-lg p-2 pr-3 w-48 shadow-sm group">
                  <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center overflow-hidden relative mr-2 shrink-0">
                    {isImage ? (
                      <Image src={file.url} alt={file.name} fill className="object-cover" unoptimized />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1" title={file.name}>{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={() => toggleAsset(file.id)}
                    className="ml-2 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
