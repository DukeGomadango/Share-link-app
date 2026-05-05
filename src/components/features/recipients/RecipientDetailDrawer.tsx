"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetHeader, SheetBody, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { CampaignTimeline } from "./CampaignTimeline";
import { Recipient, FileItem } from "@/components/features/campaigns/types";
import { Button } from "@/components/ui/button";
import { Tag, Calendar, User, Trash2, X, Plus, Shield, MessageSquare, Globe, Clock, CheckCircle2, FileAudio, FileImage, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import Image from "next/image";

interface RecipientDetailDrawerProps {
  recipient: Recipient | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTags?: (id: string, tags: string[]) => void;
  onUpdateInfo?: (id: string, info: { name: string; streamerMemo?: string }) => void;
  onRemoveRecipient?: (id: string) => void;
  onRemoveFile?: (recipientId: string, fileId: string) => void;
  existingTags?: string[];
  campaignFiles?: FileItem[];
}


export function RecipientDetailDrawer({ recipient, isOpen, onClose, onUpdateTags, onUpdateInfo, onRemoveRecipient, onRemoveFile, existingTags = [], campaignFiles = [] }: RecipientDetailDrawerProps) {
  const [newTag, setNewTag] = useState("");
  const [editName, setEditName] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Sync state when recipient changes or drawer opens
  useEffect(() => {
    if (recipient && isOpen) {
      setEditName(recipient.name);
      setEditMemo(recipient.streamerMemo || "");
      
      // Fetch real history
      setIsLoadingHistory(true);
      const targetId = recipient.globalRecipientId || recipient.id;
      fetch(`/api/recipients/${targetId}/history`)
        .then(res => res.json())
        .then(data => {
          setHistory(data);
          setIsLoadingHistory(false);
        })
        .catch(err => {
          console.error("Failed to fetch history:", err);
          setIsLoadingHistory(false);
        });
    }
  }, [recipient, isOpen]);

  if (!recipient) return null;

  const handleSaveInfo = () => {
    if (onUpdateInfo && editName.trim()) {
      onUpdateInfo(recipient.id, {
        name: editName.trim(),
        streamerMemo: editMemo.trim() || undefined
      });
      onClose(); // Close on save for a clean workflow
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !onUpdateTags) return;
    const tags = Array.from(new Set([...recipient.tags, newTag.trim()]));
    onUpdateTags(recipient.id, tags);
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!onUpdateTags) return;
    const tags = recipient.tags.filter((t) => t !== tagToRemove);
    onUpdateTags(recipient.id, tags);
  };

  const handleDelete = () => {
    if (!onRemoveRecipient || !recipient) return;
    if (confirm(`${recipient.name} さんをリストから削除しますか？\n(受取人はこのキャンペーンのファイルを受け取れなくなります)`)) {
      onRemoveRecipient(recipient.id);
      onClose();
    }
  };

  const assignedFiles = recipient?.assignedFileIds
    ? recipient.assignedFileIds
        .map((id) => campaignFiles.find((f) => f.id === id))
        .filter((f): f is FileItem => f !== undefined)
    : [];

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <SheetHeader className="bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <UserAvatar name={recipient.name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Input 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="font-bold text-lg h-9 bg-background/50 border-emerald-500/20"
                placeholder="受取人名"
              />
              {recipient.passkeyVerified && (
                <Shield className="w-5 h-5 text-sky-500 shrink-0" fill="currentColor" fillOpacity={0.1} />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {recipient.status === "waiting" ? (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">
                  <Clock className="w-3 h-3 mr-1" /> Waiting
                </Badge>
              ) : recipient.status === "verified" ? (
                <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-[10px] font-bold">
                  <Shield className="w-3 h-3 mr-1" /> Verified
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Claimed
                </Badge>
              )}

              {recipient.platformId && (
                <div className="flex items-center text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  {recipient.platformId.type === "twitter" ? (
                    <Globe className="w-3 h-3 mr-1 text-sky-400" />
                  ) : (
                    <MessageSquare className="w-3 h-3 mr-1 text-indigo-400" />
                  )}
                  {recipient.platformId.handle}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-4">
          <div className="flex flex-wrap gap-2">
            {recipient.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] bg-background/50 border-emerald-500/20 text-emerald-600 pl-2 pr-1 flex items-center gap-1 group/tag"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="opacity-0 group-hover/tag:opacity-100 hover:bg-emerald-500/10 rounded-full p-0.5 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {recipient.tags.length === 0 && (
              <span className="text-[10px] text-muted-foreground italic">タグなし</span>
            )}
          </div>

          <form onSubmit={handleAddTag} className="relative group">
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="新しいタグを追加..."
              className="pl-9 h-9 text-xs bg-background/50 border-emerald-500/10 focus-visible:ring-emerald-500/30 rounded-xl"
            />
          </form>

          {existingTags.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] text-muted-foreground mb-2 px-1">既存のタグから追加:</p>
              <div className="flex flex-wrap gap-1.5">
                {existingTags
                  .filter(tag => !recipient.tags.includes(tag))
                  .map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (onUpdateTags) {
                          onUpdateTags(recipient.id, [...recipient.tags, tag]);
                        }
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors border border-transparent hover:border-emerald-500/20"
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </SheetHeader>

      <SheetBody className="space-y-8">
        {/* Assigned Files */}
        {assignedFiles.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              現在の配布ファイル ({assignedFiles.length})
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {assignedFiles.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 group/file"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                      {file.type === "image" && file.previewUrl ? (
                        <Image src={file.previewUrl} alt={file.name} fill className="object-cover" unoptimized />
                      ) : file.type === "audio" ? (
                        <FileAudio className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <FileImage className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-emerald-600 truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{file.type}</p>
                    </div>
                  </div>
                  {onRemoveFile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full opacity-0 group-hover/file:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                      onClick={() => onRemoveFile(recipient.id, file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              リスナーからのメッセージ
            </h3>
            {recipient.listenerNote ? (
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-sm text-emerald-900 dark:text-emerald-100 italic relative">
                <div className="absolute -left-1 top-4 w-2 h-2 bg-emerald-500/10 border-l border-t border-emerald-500/10 rotate-[-45deg]" />
                {recipient.listenerNote}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic px-1">メッセージはありません</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              ライバー専用メモ
            </h3>
            <textarea
              value={editMemo}
              onChange={(e) => setEditMemo(e.target.value)}
              placeholder="例: 前回イベントの参加者、要返信など（リスナーには見えません）"
              className="w-full min-h-[120px] p-4 rounded-2xl bg-muted/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
            />
          </div>
        </section>

        <section>
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer group/header"
            onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 group-hover/header:text-foreground transition-colors">
              <Calendar className="w-3.5 h-3.5" />
              アクティビティ履歴
              {history.length > 0 && (
                <Badge variant="outline" className="ml-1 px-1.5 h-4 text-[9px] bg-emerald-500/5 border-emerald-500/20 text-emerald-600">
                  {history.length}
                </Badge>
              )}
            </h3>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isHistoryExpanded ? "rotate-180" : ""}`} />
          </div>

          {isLoadingHistory ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 opacity-50">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-[10px] font-medium">履歴を読み込み中...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <CampaignTimeline items={isHistoryExpanded ? history : history.slice(0, 2)} />
              
              {history.length > 2 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full h-9 rounded-xl text-[10px] font-bold text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 mt-2"
                  onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                >
                  {isHistoryExpanded ? (
                    <>履歴をたたむ</>
                  ) : (
                    <>残りの {history.length - 2} 件を表示</>
                  )}
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Info Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">登録日</p>
            <p className="text-sm font-medium">{new Date(recipient.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">総受取数</p>
            <p className="text-sm font-bold text-emerald-600">{history.length} 件</p>
          </div>
        </section>
      </SheetBody>

      <SheetFooter>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl h-11"
            onClick={onClose}
          >
            キャンセル
          </Button>
          <Button 
            className="flex-1 rounded-xl h-11 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
            onClick={handleSaveInfo}
          >
            保存する
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            title="リストから削除"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </SheetFooter>
    </Sheet>
  );
}
