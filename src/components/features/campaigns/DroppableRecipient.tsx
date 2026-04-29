"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Check, FileAudio, FileImage, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Recipient, FileItem } from "./types";
import { useTranslation } from "@/lib/i18n";

interface DroppableRecipientProps {
  recipient: Recipient;
  getFile: (id: string) => FileItem | undefined;
  onRemoveFile: (recipientId: string, fileId: string) => void;
  successPulse?: boolean;
}

export function DroppableRecipient({
  recipient,
  getFile,
  onRemoveFile,
  successPulse = false,
}: DroppableRecipientProps) {
  const { t } = useTranslation();
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
    .map((id) => getFile(id))
    .filter((f): f is FileItem => f !== undefined);

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
          : undefined
      }
      transition={{ duration: 0.42, ease: "easeOut" }}
      className={`p-4 rounded-xl border transition-all ${
        isOver
          ? "border-emerald-500 bg-emerald-500/10 scale-[1.02] shadow-emerald-500/20 shadow-lg"
          : successPulse
          ? "border-emerald-500 bg-emerald-500/10"
          : assignedFiles.length > 0
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border/50 bg-background/30 hover:border-border"
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-sm flex items-center">
            {recipient.name}
            {assignedFiles.length > 0 && (
              <span className="ml-2 text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-2 py-0.5 rounded-full">
                {assignedFiles.length} {t.campaigns.files}
              </span>
            )}
          </h4>
          <p className="text-xs text-muted-foreground">{recipient.email}</p>
        </div>
        {recipient.link && (
          <div className="flex space-x-2 relative z-10">
            <Button
              variant="outline"
              size="icon"
              className={`h-7 w-7 transition-colors ${
                copied
                  ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                  : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLink();
              }}
              title={t.campaigns.copyLink}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-7 w-7 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30"
              title={t.campaigns.previewLink}
            >
              <a href={recipient.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 ml-0.5 mb-0.5" />
              </a>
            </Button>
          </div>
        )}
      </div>

      <div
        className={`mt-3 p-3 rounded-lg border border-dashed flex flex-col space-y-2 text-sm ${
          assignedFiles.length > 0
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-border/50 text-muted-foreground items-center justify-center min-h-[3rem]"
        }`}
      >
        {assignedFiles.length > 0 ? (
          <>
            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
              {assignedFiles.map((file) => (
                <div
                  key={file.id}
                  className="group flex items-center justify-between w-full p-1.5 bg-background/80 border border-border/50 rounded-md"
                >
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
                    <span className="font-medium text-emerald-500 line-clamp-1 text-xs">
                      {file.name}
                    </span>
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
              {t.campaigns.dropMoreFiles}
            </div>
          </>
        ) : (
          <span className="opacity-70 flex items-center">
            <Copy className="w-4 h-4 mr-2 opacity-50" /> {t.campaigns.dropFileHere}
          </span>
        )}
      </div>
    </motion.div>
  );
}
