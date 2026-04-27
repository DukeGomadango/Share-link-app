"use client";

import { useEffect, useState } from "react";
import { FolderOpen, FileImage, FileAudio, File as FileIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import { useTranslation } from "@/lib/i18n";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { ImageViewer } from "@/components/shared/ImageViewer";

interface AssetFile {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  url: string;
  linkedCampaigns: string[];
}

export default function LibraryPage() {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<AssetFile | null>(null);
  const { t, locale } = useTranslation();

  const fetchFiles = () => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((data) => setFiles(data))
      .catch((e) => console.error("Failed to fetch files:", e));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFilesDropped = async (droppedFiles: File[]) => {
    // 実際のアプリケーションでは、ここでFormDataを使用してサーバーにアップロードします
    console.log("Files ready to upload:", droppedFiles);
    try {
      const res = await fetch("/api/files", { method: "POST" });
      if (res.ok) {
        // アップロード成功後、ファイルリストを再取得
        fetchFiles();
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const filteredFiles = files.filter((f) => {
    if (filter === "image") return f.type.startsWith("image/");
    if (filter === "audio") return f.type.startsWith("audio/");
    return true;
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (type.startsWith("audio/")) return <FileAudio className="w-8 h-8 text-purple-500" />;
    return <FileIcon className="w-8 h-8 text-gray-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.library.title}</h1>
          <p className="text-muted-foreground mt-1">{t.library.subtitle}</p>
        </div>
      </div>

      <div className="mb-8">
        <FileDropzone onFilesDropped={handleFilesDropped} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm font-medium mr-2">{t.library.filterType}:</span>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-emerald-500 text-white" : ""}
        >
          {t.library.fileType.all}
        </Button>
        <Button
          variant={filter === "image" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("image")}
          className={filter === "image" ? "bg-emerald-500 text-white" : ""}
        >
          {t.library.fileType.image}
        </Button>
        <Button
          variant={filter === "audio" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("audio")}
          className={filter === "audio" ? "bg-emerald-500 text-white" : ""}
        >
          {t.library.fileType.audio}
        </Button>
      </div>

      {files.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t.library.noFilesTitle}</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {t.library.noFilesDescription}
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFiles.map((file) => (
             <GlassCard
              key={file.id}
              className="relative group hover:border-emerald-500/50 transition-colors flex flex-col h-full cursor-pointer"
              onClick={() => setSelectedFile(file)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-xl flex items-center justify-center">
                  {getFileIcon(file.type)}
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1" title={file.name}>
                  {file.name}
                </h3>
                <div className="flex justify-between text-xs text-muted-foreground mb-3">
                  <span>{formatSize(file.size)}</span>
                  <span>{new Date(file.createdAt).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US")}</span>
                </div>
                
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs font-semibold mb-1 text-emerald-500/80">
                    {t.library.linkedCampaigns}
                  </p>
                  {file.linkedCampaigns.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {file.linkedCampaigns.map((c, i) => (
                        <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full inline-block">
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t.library.none}</span>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* 簡易的なプレビューモーダル */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl">
            <Button
              variant="outline"
              size="icon"
              className="absolute -top-12 right-0 rounded-full bg-background/50 hover:bg-background"
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-5 h-5" />
            </Button>
            
            {selectedFile.type.startsWith("image/") ? (
              <ImageViewer src={selectedFile.url} watermarkText="SAMPLE" />
            ) : selectedFile.type.startsWith("audio/") ? (
               <AudioPlayer src={selectedFile.url} title={selectedFile.name} />
            ) : (
              <GlassCard className="p-8 text-center text-muted-foreground">
                <FileIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Preview not available for this file type.</p>
              </GlassCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
