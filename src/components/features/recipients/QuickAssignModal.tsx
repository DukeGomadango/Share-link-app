"use client";

import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Recipient } from "@/components/features/campaigns/types";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Package, FileText, Music, Image as ImageIcon, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface QuickAssignModalProps {
  recipient: Recipient | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (recipientId: string, fileIds: string[]) => void;
}

const MOCK_CAMPAIGNS = [
  {
    id: "c1",
    name: "2026年 春の新作ボイス配布",
    date: "2026-05-01",
    files: [
      { id: "f1", name: "spring_voice_set.zip", type: "archive" },
      { id: "f2", name: "morning_greeting.mp3", type: "audio" },
    ]
  },
  {
    id: "c2",
    name: "フォロワー1万人記念キャンペーン",
    date: "2026-04-20",
    files: [
      { id: "f3", name: "limited_wallpaper.png", type: "image" },
      { id: "f4", name: "thank_you_video.mp4", type: "video" },
    ]
  },
  {
    id: "c3",
    name: "過去のアーカイブ（2025）",
    date: "2025-12-25",
    files: [
      { id: "f5", name: "old_voice.mp3", type: "audio" },
    ]
  }
];

export function QuickAssignModal({ recipient, isOpen, onClose, onAssign }: QuickAssignModalProps) {
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  if (!recipient) return null;

  const handleConfirm = () => {
    if (selectedFileIds.size > 0) {
      onAssign(recipient.id, Array.from(selectedFileIds));
      onClose();
      setSelectedFileIds(new Set()); // Reset
    }
  };

  const toggleFile = (fileId: string) => {
    const newSelected = new Set(selectedFileIds);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFileIds(newSelected);
  };

  // Only show top 2 most recent campaigns to keep it minimalist and scalable
  const recentCampaigns = MOCK_CAMPAIGNS
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "audio": return <Music className="w-4 h-4" />;
      case "image": return <ImageIcon className="w-4 h-4" />;
      case "video": return <FileText className="w-4 h-4" />; // Replace with Video if needed
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <DialogHeader>
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle>ファイルをクイック割り当て</DialogTitle>
            <DialogDescription>配信するファイルを選択して受取人に紐付けます</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mt-4">
        {/* Left: Recipient Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-muted/30 border border-border/50 flex flex-col items-center text-center">
            <UserAvatar name={recipient.name} size="lg" className="mb-4" />
            <h3 className="font-bold text-lg">{recipient.name}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              ID: {recipient.id.toUpperCase().slice(0, 8)}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-1">
              {recipient.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[9px] bg-background/50 border-emerald-500/20 text-emerald-600">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center justify-center text-center group transition-colors hover:border-emerald-500/40">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-emerald-700">ここにファイルをドロップ</p>
            <p className="text-[10px] text-emerald-600/60 mt-1">または右から選択</p>
          </div>
        </div>

        {/* Right: Asset List */}
        <div className="md:col-span-3 space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {recentCampaigns.map((campaign) => (
            <div key={campaign.id} className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Package className="w-3 h-3 text-emerald-500" />
                  {campaign.name}
                </h4>
                <span className="text-[9px] font-medium text-muted-foreground/50">{campaign.date}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {campaign.files.map((file) => {
                  const isSelected = selectedFileIds.has(file.id);
                  return (
                    <motion.button
                      key={file.id}
                      whileHover={{ x: 4 }}
                      onClick={() => toggleFile(file.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border transition-all text-left group",
                        isSelected 
                          ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/5" 
                          : "bg-background/40 border-border/30 hover:border-border/60 hover:bg-background/60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-xl transition-colors",
                          isSelected ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground group-hover:text-foreground"
                        )}>
                          {getFileIcon(file.type)}
                        </div>
                        <div>
                          <p className={cn(
                            "text-xs font-bold truncate max-w-[180px]",
                            isSelected ? "text-emerald-700" : "text-foreground"
                          )}>{file.name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase">{file.type}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center",
                        isSelected ? "bg-emerald-500 border-emerald-500" : "border-border/50 bg-background/50"
                      )}>
                        {isSelected && <Plus className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
          
          <div className="pt-4 px-2">
            <Link href="/campaigns">
              <Button variant="ghost" size="sm" className="w-full h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 border border-dashed border-border/50 hover:border-border hover:bg-muted/50 transition-all">
                すべてのキャンペーンを表示...
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-8">
        <Button variant="ghost" className="flex-1 rounded-2xl h-12" onClick={onClose}>
          キャンセル
        </Button>
        <Button 
          className="flex-[2] rounded-2xl h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:grayscale transition-all"
          disabled={selectedFileIds.size === 0}
          onClick={handleConfirm}
        >
          <Plus className="w-4 h-4 mr-2" />
          {selectedFileIds.size > 0 ? `${selectedFileIds.size} 件の割り当てを確定` : "割り当てを確定"}
        </Button>
      </div>
    </Dialog>
  );
}
