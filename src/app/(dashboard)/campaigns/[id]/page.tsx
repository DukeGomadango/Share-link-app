"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { GlassCard } from "@/components/shared/GlassCard";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Copy, FileAudio, FileImage, Link as LinkIcon, Download, Users, MailPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// モックデータ型
type FileItem = { id: string; name: string; type: "audio" | "image" };
type Recipient = { id: string; name: string; email: string; assignedFileId?: string | null; link?: string };

// Draggable コンポーネント (ファイルアイテム)
function DraggableFileItem({ file }: { file: FileItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `file-${file.id}`,
    data: { file },
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-lg border bg-background/50 flex items-center space-x-3 cursor-grab active:cursor-grabbing hover:border-emerald-500/50 transition-colors ${
        isDragging ? "opacity-50 ring-2 ring-emerald-500 shadow-xl" : "border-border/50"
      }`}
    >
      <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-500">
        {file.type === "audio" ? <FileAudio className="w-4 h-4" /> : <FileImage className="w-4 h-4" />}
      </div>
      <div>
        <p className="text-sm font-medium line-clamp-1">{file.name}</p>
        <p className="text-xs text-muted-foreground">{file.type === "audio" ? "Voice" : "Image"}</p>
      </div>
    </div>
  );
}

// Droppable コンポーネント (宛先アイテム)
function DroppableRecipient({ recipient, getFile }: { recipient: Recipient; getFile: (id: string) => FileItem | undefined }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `recipient-${recipient.id}`,
    data: { recipient },
  });

  const assignedFile = recipient.assignedFileId ? getFile(recipient.assignedFileId) : null;

  return (
    <div
      ref={setNodeRef}
      className={`p-4 rounded-xl border transition-all ${
        isOver
          ? "border-emerald-500 bg-emerald-500/10 scale-[1.02] shadow-emerald-500/20 shadow-lg"
          : assignedFile 
            ? "border-emerald-500/30 bg-emerald-500/5" 
            : "border-border/50 bg-background/30 hover:border-border"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-sm flex items-center">
            {recipient.name}
            {assignedFile && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-2" />}
          </h4>
          <p className="text-xs text-muted-foreground">{recipient.email}</p>
        </div>
      </div>

      <div className={`mt-3 p-3 rounded-lg border border-dashed flex items-center justify-center text-sm ${
        assignedFile ? "border-emerald-500/30 bg-emerald-500/10" : "border-border/50 text-muted-foreground"
      }`}>
        {assignedFile ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              {assignedFile.type === "audio" ? <FileAudio className="w-4 h-4 text-emerald-500" /> : <FileImage className="w-4 h-4 text-emerald-500" />}
              <span className="font-medium text-emerald-500 line-clamp-1">{assignedFile.name}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); /* コピー処理 */ }}>
              <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </Button>
          </div>
        ) : (
          <span className="opacity-70">Drop a file here</span>
        )}
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  
  // モックデータ状態
  const [files, setFiles] = useState<FileItem[]>([
    { id: "f1", name: "good_morning_voice.wav", type: "audio" ],
    { id: "f2", name: "special_photo.jpg", type: "image" },
    { id: "f3", name: "thank_you_message.wav", type: "audio" },
  ]);
  
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "r1", name: "Fan A", email: "fan.a@example.com", assignedFileId: null },
    { id: "r2", name: "Fan B", email: "fan.b@example.com", assignedFileId: null },
    { id: "r3", name: "Fan C", email: "fan.c@example.com", assignedFileId: null },
  ]);

  const [activeDragFile, setActiveDragFile] = useState<FileItem | null>(null);

  const handleDragStart = (event: any) => {
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
          // 擬似的なリンク生成
          return { ...r, assignedFileId: fileId, link: `https://claim.share-app.com/${Math.random().toString(36).substring(7)}` };
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
            <span className="text-muted-foreground">{params.id}</span>
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
              
              <div className="pt-4 border-t border-dashed border-border mt-6">
                <FileDropzone onFilesDropped={(newFiles) => {
                  const newItems = newFiles.map((f, i) => ({
                    id: `f-new-${Date.now()}-${i}`,
                    name: f.name,
                    type: f.type.startsWith('audio') ? "audio" as const : "image" as const
                  }));
                  setFiles([...files, ...newItems]);
                }} />
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
                />
              ))}
            </div>
          </GlassCard>

        </div>

        {/* ドラッグ中のオーバーレイ表示 */}
        <DragOverlay>
          {activeDragFile ? (
            <div className="p-3 rounded-lg border border-emerald-500 bg-background/90 shadow-2xl flex items-center space-x-3 rotate-3 scale-105 cursor-grabbing">
              <div className="p-2 bg-emerald-500/20 rounded-md text-emerald-500">
                {activeDragFile.type === "audio" ? <FileAudio className="w-4 h-4" /> : <FileImage className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-medium line-clamp-1">{activeDragFile.name}</p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
