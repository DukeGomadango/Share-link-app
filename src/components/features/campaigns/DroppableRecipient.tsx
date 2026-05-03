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
        className={`mt-2 p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
          isUnlinked
            ? "border-dashed border-amber-500/40 bg-amber-500/5 min-h-[5rem] group-hover/card:bg-amber-500/10"
            : "border-solid border-emerald-500/20 bg-background/50 min-h-[4rem]"
        }`}
      >
        {assignedFiles.length > 0 ? (
          <div className="w-full space-y-2">
            {assignedFiles.map((file: any) => (
              <div
                key={file.id}
                className="group flex items-center justify-between w-full p-2 bg-background border border-border/50 rounded-lg shadow-sm"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 shrink-0 relative overflow-hidden rounded-md flex items-center justify-center bg-emerald-500/10">
                    {file.type === "image" && file.previewUrl ? (
                      <Image src={file.previewUrl} alt={file.name} fill className="object-cover" unoptimized />
                    ) : file.type === "audio" ? (
                      <FileAudio className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <FileImage className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-emerald-600 line-clamp-1 text-xs">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">{file.type}</span>
                  </div>
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(recipient.id, file.id);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-amber-600/60 group-hover/card:text-amber-600 transition-colors">
            <div className="p-2 rounded-full bg-amber-500/10 border border-amber-500/20 animate-pulse">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider">ファイルをドロップ</span>
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
