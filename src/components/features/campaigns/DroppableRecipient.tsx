"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import {
  Copy,
  ExternalLink,
  Check,
  FileAudio,
  FileImage,
  X,
  AlertCircle,
  Plus,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Recipient, FileItem } from "./types";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface DroppableRecipientProps {
  recipient: Recipient;
  getFile: (id: string) => FileItem | undefined;
  onRemoveFile: (recipientId: string, fileId: string) => void;
  successPulse?: boolean;
  /** DB 上の発行済み Claim 行はドロップで変更できない */
  readOnly?: boolean;
  onClick?: () => void;
}

export function DroppableRecipient({
  recipient,
  getFile,
  onRemoveFile,
  successPulse = false,
  readOnly = false,
  onClick,
}: DroppableRecipientProps) {
  const { t } = useTranslation();
  const { isOver, setNodeRef } = useDroppable({
    id: `recipient-${recipient.id}`,
    data: { recipient },
    disabled: readOnly,
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

  const assignedFiles = (recipient as any).assignedFileIds
    ? (recipient as any).assignedFileIds
        .map((id: string) => getFile(id))
        .filter((f: any): f is FileItem => f !== undefined)
    : [];

  const isUnlinked = assignedFiles.length === 0;

  return (
    <motion.div
      ref={setNodeRef}
      initial={false}
      animate={
        successPulse
          ? {
              scale: [1, 1.02, 1],
              boxShadow: [
                "0 0 0 rgba(16,185,129,0)",
                "0 0 0 6px rgba(16,185,129,0.18)",
                "0 0 0 rgba(16,185,129,0)",
              ],
            }
          : { scale: 1 }
      }
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      transition={{ duration: 0.42, ease: "easeOut" }}
      className={cn(
        `p-4 rounded-2xl border transition-all relative group/card cursor-pointer`,
        isOver
          ? "border-emerald-500 bg-emerald-500/10 scale-[1.02] shadow-emerald-500/20 shadow-lg"
          : successPulse
          ? "border-emerald-500 bg-emerald-500/10"
          : isUnlinked
          ? "border-amber-500/30 border-dashed bg-amber-500/5 hover:border-amber-500/50"
          : "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">
              {recipient.name}
            </h4>
            {isUnlinked ? (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-amber-500/50 text-amber-600 bg-amber-500/10 font-bold uppercase tracking-tighter">
                <AlertCircle className="w-2.5 h-2.5 mr-1" />
                未紐付け
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-emerald-500/50 text-emerald-600 bg-emerald-500/10 font-bold uppercase tracking-tighter">
                <Check className="w-2.5 h-2.5 mr-1" />
                準備完了
              </Badge>
            )}
            {recipient.passkeyVerified ? (
              <Badge
                variant="outline"
                className="text-[9px] h-4 px-1.5 border-sky-500/40 text-sky-700 bg-sky-500/10 font-bold uppercase tracking-tighter"
                title="パスキーで本人確認済み（参考情報です）"
              >
                <KeyRound className="w-2.5 h-2.5 mr-1" />
                認証済
              </Badge>
            ) : null}
          </div>
          {"listenerNote" in recipient && (recipient as { listenerNote?: string }).listenerNote && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 opacity-80">
              {(recipient as { listenerNote?: string }).listenerNote}
            </p>
          )}
        </div>
        
        {recipient.link && (
          <div className="flex space-x-1.5 relative z-10 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className={`h-7 w-7 rounded-full transition-colors ${
                copied
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-background/50 border-border/50 text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/30"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLink();
              }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-7 w-7 rounded-full bg-background/50 border-border/50 text-muted-foreground hover:text-blue-500 hover:border-blue-500/30"
            >
              <a href={recipient.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>
        )}
      </div>

      <div
        className={cn(
          "mt-2 p-3 rounded-xl border flex items-center transition-all",
          isUnlinked
            ? "border-dashed border-amber-500/40 bg-amber-500/5 min-h-[4rem] group-hover/card:bg-amber-500/10 justify-center"
            : "border-solid border-emerald-500/20 bg-background/50 min-h-[4rem] justify-between"
        )}
      >
        {assignedFiles.length > 0 ? (
          <>
            <div className="flex -space-x-3 overflow-hidden p-1">
              {assignedFiles.slice(0, 4).map((file: any, i: number) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ zIndex: 10 - i }}
                  className="relative w-10 h-10 rounded-xl ring-2 ring-background bg-emerald-500/10 flex items-center justify-center overflow-hidden shadow-sm shrink-0"
                >
                  {file.type === "image" && file.previewUrl ? (
                    <Image src={file.previewUrl} alt={file.name} fill className="object-cover" unoptimized />
                  ) : file.type === "audio" ? (
                    <FileAudio className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <FileImage className="w-5 h-5 text-emerald-500" />
                  )}
                </motion.div>
              ))}
              {assignedFiles.length > 4 && (
                <div className="w-10 h-10 rounded-xl ring-2 ring-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground z-0 shadow-sm shrink-0">
                  +{assignedFiles.length - 4}
                </div>
              )}
            </div>
            
            <div className="text-right ml-2">
              <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest block">
                {assignedFiles.length} {t.common.files || "Files"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-amber-600/60 group-hover/card:text-amber-600 transition-colors">
            <div className="p-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 animate-pulse">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">ファイルをドロップ</span>
          </div>
        )}
      </div>
      
      {/* Visual background indicator for drop */}
      {isOver && (
        <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl border-2 border-emerald-500 animate-pulse pointer-events-none" />
      )}
    </motion.div>
  );
}
