"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { GlassCard } from "@/components/shared/GlassCard";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Link as LinkIcon, Download, Users, MailPlus, FolderOpen, FileAudio, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import { FileItem, Recipient, LibraryFile } from "@/components/features/campaigns/types";
import { DraggableFileItem } from "@/components/features/campaigns/DraggableFileItem";
import { DroppableRecipient } from "@/components/features/campaigns/DroppableRecipient";
import { LibrarySelectModal } from "@/components/features/campaigns/LibrarySelectModal";

export default function CampaignDetailPage() {
  const params = useParams();

  // モックデータ状態
  const [files, setFiles] = useState<FileItem[]>([
    { id: "f1", name: "good_morning_voice.wav", type: "audio" },
    { id: "f2", name: "special_photo.jpg", type: "image", previewUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=200&auto=format&fit=crop" },
    { id: "f3", name: "thank_you_message.wav", type: "audio" },
  ]);

  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "r1", name: "Fan A", email: "fan.a@example.com", assignedFileIds: [] },
    { id: "r2", name: "Fan B", email: "fan.b@example.com", assignedFileIds: [] },
    { id: "r3", name: "Fan C", email: "fan.c@example.com", assignedFileIds: [] },
  ]);

  const [activeDragFile, setActiveDragFile] = useState<FileItem | null>(null);

  // ライブラリモーダル用状態
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([]);

  const fetchLibraryFiles = () => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((data) => setLibraryFiles(data))
      .catch((e) => console.error(e));
  };

  const handleRemoveFile = (recipientId: string, fileId: string) => {
    setRecipients((prev) =>
      prev.map((r) => {
        if (r.id === recipientId) {
          return {
            ...r,
            assignedFileIds: r.assignedFileIds.filter((id) => id !== fileId),
          };
        }
        return r;
      })
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const file = active.data.current?.file;
    if (file) setActiveDragFile(file);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragFile(null);

    if (over && over.id.toString().startsWith("recipient-")) {
      const fileId = active.id.toString().replace("file-", "");
      const recipientId = over.id.toString().replace("recipient-", "");

      setRecipients(prev => prev.map(r => {
        if (r.id === recipientId) {
          const newFileIds = r.assignedFileIds.includes(fileId)
            ? r.assignedFileIds
            : [...r.assignedFileIds, fileId];
          // 動くリンクへの遷移ができるようルートパスで生成
          return { ...r, assignedFileIds: newFileIds, link: r.link || `/claim/${Math.random().toString(36).substring(7)}` };
        }
        return r;
      }));
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <div className="flex items-center space-x-2 text-sm text-emerald-500 mb-1">
            <span className="uppercase tracking-wider font-semibold text-xs">Direct Campaign</span>
            <span>•</span>
            <span className="text-muted-foreground">{params.id as string}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Flow</h1>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="glass">
            <Download className="w-4 h-4 mr-2" />
            Export Links
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg">
            <LinkIcon className="w-4 h-4 mr-2" />
            Generate All
          </Button>
        </div>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">

          {/* 左カラム: ファイルプール */}
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
                <DraggableFileItem key={file.id} file={file} />
              ))}

              <div className="flex gap-4 pt-4 border-t border-dashed border-border mt-6">
                <div className="flex-1">
                  <FileDropzone onFilesDropped={(newFiles) => {
                    const newItems = newFiles.map((f, i) => ({
                      id: `f-new-${Date.now()}-${i}`,
                      name: f.name,
                      type: f.type.startsWith('audio') ? "audio" as const : "image" as const,
                      previewUrl: f.type.startsWith('image') ? URL.createObjectURL(f) : undefined
                    }));
                    setFiles([...files, ...newItems]);
                  }} />
                </div>
                <div
                  className="flex-1 border-2 border-dashed border-border/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5"
                  onClick={() => {
                    setShowLibraryModal(true);
                    fetchLibraryFiles();
                  }}
                >
                  <FolderOpen className="w-10 h-10 mb-2 text-emerald-500" />
                  <p className="text-sm font-medium text-foreground">Add from Library</p>
                  <p className="text-xs text-muted-foreground mt-1 text-center">Select existing assets</p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* 右カラム: 宛先カード */}
          <GlassCard className="flex flex-col overflow-hidden h-full">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50 shrink-0">
              <h2 className="text-lg font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                Recipients
              </h2>
              <Button variant="ghost" size="sm" className="h-8 text-emerald-500 hover:text-emerald-600">
                <MailPlus className="w-4 h-4 mr-1" />
                Add Recipients
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max pb-20">
              {recipients.map(recipient => (
                <DroppableRecipient
                  key={recipient.id}
                  recipient={recipient}
                  getFile={(id) => files.find(f => f.id === id)}
                  onRemoveFile={handleRemoveFile}
                />
              ))}
            </div>
          </GlassCard>

        </div>

        {/* ドラッグ中のオーバーレイ表示 */}
        <DragOverlay>
          {activeDragFile ? (
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
          ) : null}
        </DragOverlay>
      </DndContext>

      <LibrarySelectModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        libraryFiles={libraryFiles}
        onAddFiles={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
      />
    </div>
  );
}
