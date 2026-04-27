"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { GlassCard } from "@/components/shared/GlassCard";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { Copy, FileAudio, FileImage, Link as LinkIcon, Download, Users, MailPlus, CheckCircle2, X, ExternalLink, Check, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// モックデータ型
type FileItem = { id: string; name: string; type: "audio" | "image"; previewUrl?: string };
type Recipient = { id: string; name: string; email: string; assignedFileIds: string[]; link?: string };

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
      <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-500 shrink-0 relative overflow-hidden flex items-center justify-center w-10 h-10">
        {file.type === "image" && file.previewUrl ? (
          <Image src={file.previewUrl} alt={file.name} fill className="object-cover" unoptimized />
        ) : file.type === "audio" ? (
          <FileAudio className="w-5 h-5" />
        ) : (
          <FileImage className="w-5 h-5" />
        )}
      </div>
      <div className="overflow-hidden">
        <p className="text-sm font-medium line-clamp-1">{file.name}</p>
        <p className="text-xs text-muted-foreground">{file.type === "audio" ? "Voice" : "Image"}</p>
      </div>
    </div>
  );
}

// Droppable コンポーネント (宛先アイテム)
function DroppableRecipient({ recipient, getFile, onRemoveFile }: { recipient: Recipient; getFile: (id: string) => FileItem | undefined; onRemoveFile: (recipientId: string, fileId: string) => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `recipient-${recipient.id}`,
    data: { recipient },
  });
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (recipient.link) {
      const url = `${window.location.origin}${recipient.link}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const assignedFiles = recipient.assignedFileIds
    .map(id => getFile(id))
    .filter((f): f is FileItem => f !== undefined);

  return (
    <div
      ref={setNodeRef}
      className={`p-4 rounded-xl border transition-all ${
        isOver
          ? "border-emerald-500 bg-emerald-500/10 scale-[1.02] shadow-emerald-500/20 shadow-lg"
          : assignedFiles.length > 0
            ? "border-emerald-500/30 bg-emerald-500/5" 
            : "border-border/50 bg-background/30 hover:border-border"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-sm flex items-center">
            {recipient.name}
            {assignedFiles.length > 0 && <span className="ml-2 text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-2 py-0.5 rounded-full">{assignedFiles.length} files</span>}
          </h4>
          <p className="text-xs text-muted-foreground">{recipient.email}</p>
        </div>
        {recipient.link && (
          <div className="flex space-x-2 relative z-10">
            <Button
              variant="outline"
              size="icon"
              className={`h-7 w-7 transition-colors ${copied ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600" : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30"}`}
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLink();
              }}
              title="Copy Link"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-7 w-7 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30"
              title="Preview Link"
            >
              <a href={recipient.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 ml-0.5 mb-0.5" />
              </a>
            </Button>
          </div>
        )}
      </div>

      <div className={`mt-3 p-3 rounded-lg border border-dashed flex flex-col space-y-2 text-sm ${
        assignedFiles.length > 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50 text-muted-foreground items-center justify-center min-h-[3rem]"
      }`}>
        {assignedFiles.length > 0 ? (
          <>
            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
              {assignedFiles.map(file => (
                <div key={file.id} className="group flex items-center justify-between w-full p-1.5 bg-background/80 border border-border/50 rounded-md">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <div className="w-6 h-6 shrink-0 relative overflow-hidden rounded flex items-center justify-center bg-emerald-500/10">
                      {file.type === "image" && file.previewUrl ? (
                        <Image src={file.previewUrl} alt={file.name} fill className="object-cover" unoptimized />
                      ) : file.type === "audio" ? (
                        <FileAudio className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <FileImage className="w-3 h-3 text-emerald-500" />
                      )}
                    </div>
                    <span className="font-medium text-emerald-500 line-clamp-1 text-xs">{file.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onRemoveFile(recipient.id, file.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="text-center pt-2 border-t border-emerald-500/20 border-dashed text-xs text-muted-foreground mt-1">
              Drop more files here
            </div>
          </>
        ) : (
          <span className="opacity-70 flex items-center"><Copy className="w-4 h-4 mr-2 opacity-50" /> Drop a file here</span>
        )}
      </div>
    </div>
  );
}

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
  const [libraryFiles, setLibraryFiles] = useState<any[]>([]);
  const [selectedLibraryFileIds, setSelectedLibraryFileIds] = useState<Set<string>>(new Set());

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

      {/* ライブラリファイル選択モーダル */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl glass p-6 rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-border/50">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 rounded-full text-muted-foreground hover:bg-muted"
              onClick={() => {
                setShowLibraryModal(false);
                setSelectedLibraryFileIds(new Set());
              }}
            >
              <X className="w-5 h-5" />
            </Button>
            <h2 className="text-2xl font-bold mb-1">Select from Library</h2>
            <p className="text-sm text-muted-foreground mb-6">Choose one or more files to add to this campaign.</p>
            
            <div className="flex-1 overflow-y-auto mb-6 min-h-[300px] pr-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                 {libraryFiles.map(file => {
                   const isSelected = selectedLibraryFileIds.has(file.id);
                   return (
                     <div 
                       key={file.id}
                       className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center relative select-none ${isSelected ? 'border-emerald-500 bg-emerald-500/10 shadow-md transform scale-[1.02]' : 'border-border/50 bg-background/50 hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}
                       onClick={() => {
                         const next = new Set(selectedLibraryFileIds);
                         if (next.has(file.id)) next.delete(file.id);
                         else next.add(file.id);
                         setSelectedLibraryFileIds(next);
                       }}
                     >
                       {isSelected && (
                         <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-sm">
                           <Check className="w-3 h-3" />
                         </div>
                       )}
                       <div className="w-14 h-14 bg-muted/50 rounded-full flex items-center justify-center mb-3">
                         {file.type.startsWith("image") ? <FileImage className="w-7 h-7 text-blue-500" /> : <FileAudio className="w-7 h-7 text-emerald-500" />}
                       </div>
                       <span className="text-xs font-semibold text-center line-clamp-2 w-full leading-tight">{file.name}</span>
                     </div>
                   );
                 })}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 shrink-0 pt-4 border-t border-border/50">
              <Button variant="outline" className="glass" onClick={() => {
                setShowLibraryModal(false);
                setSelectedLibraryFileIds(new Set());
              }}>
                Cancel
              </Button>
              <Button 
                className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
                disabled={selectedLibraryFileIds.size === 0}
                onClick={() => {
                  const selectedFiles = libraryFiles
                    .filter(f => selectedLibraryFileIds.has(f.id))
                    .map(f => ({
                       id: `f-${f.id}-${Date.now()}`,
                       name: f.name,
                       type: f.type.startsWith("image") ? "image" as const : "audio" as const,
                       previewUrl: f.url
                    }));
                  setFiles(prev => [...prev, ...selectedFiles]);
                  setShowLibraryModal(false);
                  setSelectedLibraryFileIds(new Set());
                }}
              >
                Add {selectedLibraryFileIds.size > 0 ? `${selectedLibraryFileIds.size} File${selectedLibraryFileIds.size > 1 ? 's' : ''}` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
