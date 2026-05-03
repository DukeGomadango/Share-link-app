"use client";

import { Sheet, SheetHeader, SheetBody, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { CampaignTimeline } from "./CampaignTimeline";
import { Recipient } from "@/components/features/campaigns/types";
import { Button } from "@/components/ui/button";
import { Mail, Tag, Calendar, User, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecipientDetailDrawerProps {
  recipient: Recipient | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for the timeline
const MOCK_HISTORY = [
  {
    id: "h1",
    campaignName: "2026年 春の新作ボイス配布",
    fileName: "spring_voice_set.zip",
    status: "opened" as const,
    date: "2026/04/15 14:22",
    token: "tk_abc123"
  },
  {
    id: "h2",
    campaignName: "フォロワー1万人記念壁紙",
    fileName: "desktop_wallpaper_4k.png",
    status: "unopened" as const,
    date: "2026/04/28 10:05",
    token: "tk_def456"
  },
  {
    id: "h3",
    campaignName: "限定サイン入りデジタルブロマイド",
    fileName: "signed_photo_v1.jpg",
    status: "expired" as const,
    date: "2026/03/10 18:30",
    token: "tk_ghi789"
  }
];

export function RecipientDetailDrawer({ recipient, isOpen, onClose }: RecipientDetailDrawerProps) {
  if (!recipient) return null;

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <SheetHeader className="bg-gradient-to-br from-emerald-500/5 to-transparent">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
            {recipient.name.charAt(0)}
          </div>
          <div>
            <SheetTitle>{recipient.name}</SheetTitle>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Mail className="w-3 h-3 mr-1.5 opacity-60" />
              {recipient.email || "メール未登録"}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {recipient.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px] bg-background/50 border-emerald-500/20 text-emerald-600">
              {tag}
            </Badge>
          ))}
          {recipient.tags.length === 0 && (
            <span className="text-[10px] text-muted-foreground italic">タグなし</span>
          )}
        </div>
      </SheetHeader>

      <SheetBody className="space-y-8">
        {/* Recipient Insights */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            アクティビティ履歴
          </h3>
          <CampaignTimeline items={MOCK_HISTORY} />
        </section>

        {/* Info Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">登録日</p>
            <p className="text-sm font-medium">{new Date(recipient.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">総受取数</p>
            <p className="text-sm font-bold text-emerald-600">12 件</p>
          </div>
        </section>
      </SheetBody>

      <SheetFooter>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex-1 rounded-xl h-11">
            情報を編集
          </Button>
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </SheetFooter>
    </Sheet>
  );
}
