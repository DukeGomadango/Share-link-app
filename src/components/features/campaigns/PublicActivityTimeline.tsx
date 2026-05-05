"use client";

import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { User, KeyRound, Clock, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Recipient } from "@/components/features/campaigns/types";

interface PublicActivityTimelineProps {
  recipients: Recipient[];
  onRecipientClick: (recipient: Recipient) => void;
  onRemove: (recipientId: string) => void;
  pulsedRecipientId?: string | null;
}

export function PublicActivityTimeline({ 
  recipients, 
  onRecipientClick,
  onRemove,
  pulsedRecipientId 
}: PublicActivityTimelineProps) {
  // 新しい順にソート
  const sorted = [...recipients].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="relative space-y-2 pb-10">
      {/* 垂直のタイムライン線 */}
      <div className="absolute left-6 top-2 bottom-6 w-px bg-gradient-to-b from-blue-500/20 via-blue-500/10 to-transparent" />

      {sorted.map((recipient, index) => {
        const isNew = pulsedRecipientId === recipient.id;
        const timeStr = formatDistanceToNow(new Date(recipient.createdAt), { 
          addSuffix: true, 
          locale: ja 
        });

        return (
          <div 
            key={recipient.id}
            onClick={() => {
              if (recipient.name !== "ゲスト") {
                onRecipientClick(recipient);
              }
            }}
            className={cn(
              "relative group flex items-center gap-4 p-3 rounded-2xl transition-all",
              recipient.name !== "ゲスト" ? "cursor-pointer hover:bg-white/60 hover:shadow-sm" : "cursor-default",
              "active:scale-[0.99]",
              isNew && "animate-pulse bg-blue-500/5 ring-1 ring-blue-500/20"
            )}
          >
            {/* タイムラインのドット/アイコン */}
            <div className="relative z-10 flex-shrink-0 w-12 h-12 flex items-center justify-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                recipient.passkeyVerified 
                  ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20" 
                  : "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20",
                "group-hover:scale-110 duration-200"
              )}>
                {recipient.passkeyVerified ? (
                  <KeyRound className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-bold truncate",
                  recipient.name === "ゲスト" ? "text-muted-foreground" : "text-foreground"
                )}>
                  {recipient.name}
                </span>
                {recipient.passkeyVerified && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-tighter border border-emerald-500/20">
                    VERIFIED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                <Clock className="w-3 h-3" />
                {timeStr}
                {recipient.listenerNote && (
                  <span className="truncate max-w-[150px] opacity-70">
                    • {recipient.listenerNote}
                  </span>
                )}
              </div>
            </div>

            {/* 右端のアクション */}
            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`${recipient.name} さんのログを削除しますか？`)) {
                    onRemove(recipient.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {recipient.name !== "ゲスト" && (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
