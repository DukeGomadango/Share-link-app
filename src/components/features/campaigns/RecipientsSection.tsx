"use client";

import { Users, MailPlus, LayoutGrid, List, KeyRound, User, Check, Copy, ExternalLink, AlertCircle, Plus, FileAudio, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { DroppableRecipient } from "@/components/features/campaigns/DroppableRecipient";
import { Recipient, FileItem } from "@/components/features/campaigns/types";
import { useState } from "react";
import { RecipientDetailDrawer } from "@/components/features/recipients/RecipientDetailDrawer";
import { PublicActivityTimeline } from "@/components/features/campaigns/PublicActivityTimeline";

interface RecipientsSectionProps {
  recipients: Recipient[];
  files: FileItem[];
  pulsedRecipientId: string | null;
  onRemoveFile: (recipientId: string, fileId: string) => void;
  onRemoveRecipient: (recipientId: string) => void;
  onMerge: (sourceId: string, targetId: string) => void;
  readOnly?: boolean;
  onAddRecipients?: () => void;
  /** ワークフロー読み込み中など、ボタンを無効にするだけの用途（プール空でもクリック可） */
  addRecipientsDisabled?: boolean;
  /** ファイルプールにまだ何もないときの案内を表示 */
  showPoolEmptyHint?: boolean;
  /** キャンペーンが下書き状態かどうか */
  isDraft?: boolean;
  /** キャンペーンがパブリックモードかどうか */
  isPublic?: boolean;
  /** 表示モード */
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
}

export function RecipientsSection({
  recipients,
  files,
  pulsedRecipientId,
  onRemoveFile,
  onRemoveRecipient,
  onMerge,
  readOnly = false,
  onAddRecipients,
  addRecipientsDisabled = false,
  showPoolEmptyHint = false,
  isDraft = false,
  isPublic = false,
  viewMode = "grid",
  onViewModeChange,
}: RecipientsSectionProps) {
  const { t } = useTranslation();
  const [detailRecipientId, setDetailRecipientId] = useState<string | null>(null);

  // 事前準備された（待機中ではない）スロットのリスト
  const preparedSlots = recipients.filter(r => r.status !== 'waiting');
  const detailRecipient = recipients.find(r => r.id === detailRecipientId) || null;

  return (
    <>
      <GlassCard className="flex flex-col overflow-hidden h-full">
      <div className="shrink-0 space-y-2 mb-4 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold flex items-center min-w-0">
            <Users className="w-5 h-5 mr-2 shrink-0 text-blue-500" />
            <span className="truncate">{isPublic ? "参加状況・アクティビティ" : t.campaigns.recipients}</span>
            {recipients.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black border border-blue-500/20">
                {recipients.length}
              </span>
            )}
          </h2>
          {!isPublic && (
            <div className="flex items-center gap-3 shrink-0">
              {/* 表示切替トグル */}
              <div className="flex bg-muted/50 p-0.5 rounded-lg border border-border/40 scale-90 origin-right">
                <button
                  type="button"
                  onClick={() => onViewModeChange?.("grid")}
                  className={cn(
                    "px-2 py-1 rounded-md transition-all",
                    viewMode === "grid" ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground"
                  )}
                  title={t.campaigns.gridView}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange?.("list")}
                  className={cn(
                    "px-2 py-1 rounded-md transition-all",
                    viewMode === "list" ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground"
                  )}
                  title={t.campaigns.listView}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-emerald-500 hover:text-emerald-600"
                disabled={addRecipientsDisabled || !onAddRecipients}
                onClick={onAddRecipients}
                title={
                  addRecipientsDisabled
                    ? "キャンペーンを公開すると追加できるようになります"
                    : t.campaigns.addRecipientsButtonTitle
                }
              >
                <MailPlus className="w-4 h-4 mr-1" />
                {t.campaigns.addRecipients}
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {isPublic 
            ? "このキャンペーンはパブリック配布です。リンクからアクセスしたユーザーがここに自動的に表示されます。" 
            : t.campaigns.recipientsSectionDescription}
        </p>
        {isDraft ? (
          <p
            className="text-xs leading-relaxed rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-emerald-900 dark:text-emerald-100"
            role="status"
          >
            準備ができたら、右上の「キャンペーンを公開する」を押して配布を開始しましょう。公開するとリンクを発行できるようになります。
          </p>
        ) : showPoolEmptyHint ? (
          <p
            className="text-xs leading-relaxed rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-100"
            role="status"
          >
            {t.campaigns.recipientsNeedPoolFiles}
          </p>
        ) : null}
      </div>

      <div className={cn(
        "scrollbar-prominent overflow-y-auto overflow-x-hidden flex-1 pr-2 pb-20",
        isPublic || viewMode === "list" ? "block space-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max"
      )}>
        {recipients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-2 border border-dashed border-border/60 rounded-xl">
            {isPublic ? "まだアクセスはありません" : t.campaigns.recipientsEmpty}
          </p>
        ) : isPublic ? (
          <PublicActivityTimeline 
            recipients={recipients}
            pulsedRecipientId={pulsedRecipientId}
            onRecipientClick={(r) => setDetailRecipientId(r.id)}
            onRemove={onRemoveRecipient}
          />
        ) : (
          recipients.map((recipient) => {
            // この受取人が「入室したて（ファイル未紐付け）」の場合、マッチ候補を探す
            const isWaiting = recipient.status === 'waiting' || (recipient.assignedFileIds?.length === 0);
            
            const matchingSlot = isWaiting 
              ? preparedSlots.find(p => 
                  p.id !== recipient.id && 
                  p.name.toLowerCase().trim() === recipient.name.toLowerCase().trim() &&
                  (p.assignedFileIds?.length || 0) > 0
                )
              : undefined;

            if (viewMode === "list") {
              return (
                <DroppableRecipientRow
                  key={recipient.id}
                  recipient={recipient}
                  matchingPreparedSlot={matchingSlot}
                  onMerge={onMerge}
                  getFile={(id) => files.find((f) => f.id === id)}
                  onRemoveFile={onRemoveFile}
                  successPulse={pulsedRecipientId === recipient.id}
                  readOnly={readOnly}
                  onClick={() => setDetailRecipientId(recipient.id)}
                />
              );
            }

            return (
              <DroppableRecipient
                key={recipient.id}
                recipient={recipient}
                matchingPreparedSlot={matchingSlot}
                onMerge={onMerge}
                getFile={(id) => files.find((f) => f.id === id)}
                onRemoveFile={onRemoveFile}
                successPulse={pulsedRecipientId === recipient.id}
                readOnly={readOnly}
                onClick={() => setDetailRecipientId(recipient.id)}
              />
            );
          })
        )}
      </div>
      </GlassCard>
      <RecipientDetailDrawer 
        recipient={detailRecipient} 
        isOpen={!!detailRecipientId} 
        onClose={() => setDetailRecipientId(null)} 
        onRemoveRecipient={onRemoveRecipient}
        onRemoveFile={onRemoveFile}
        campaignFiles={files}
      />
    </>
  );
}

// リスト形式の受取人コンポーネント（DroppableRecipient のロジックを流用しつつコンパクトに）
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

function DroppableRecipientRow({
  recipient,
  getFile,
  onRemoveFile,
  successPulse,
  readOnly,
  onClick,
  matchingPreparedSlot,
  onMerge,
}: any) {
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: `recipient-${recipient.id}`,
    data: { recipient, type: "recipient" },
    disabled: readOnly,
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: `recipient-${recipient.id}`,
    data: { recipient, type: "recipient" },
    disabled: readOnly,
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDroppableRef(node);
    setDraggableRef(node);
  };

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
    ? recipient.assignedFileIds
        .map((id: string) => getFile(id))
        .filter((f: any) => f !== undefined)
    : [];

  const isUnlinked = assignedFiles.length === 0;

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-4 p-3 rounded-2xl transition-all cursor-grab active:cursor-grabbing",
        isDragging ? "opacity-0 invisible" : "opacity-100 border",
        isOver && !isDragging
          ? "border-blue-500 bg-blue-500/5 shadow-sm"
          : successPulse
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-border/40 hover:bg-white/60 hover:shadow-sm"
      )}
    >
      {/* Icon / Avatar */}
      <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
            recipient.passkeyVerified
              ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"
              : isUnlinked
              ? "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"
              : "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20"
          )}
        >
          {recipient.passkeyVerified ? (
            <KeyRound className="w-4 h-4" />
          ) : isUnlinked ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <User className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Name / Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold truncate text-sm">{recipient.name}</span>
          {recipient.passkeyVerified && (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-tighter border border-emerald-500/20">
              VERIFIED
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
          {assignedFiles.length > 0 ? (
            <span className="text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              {assignedFiles.length} ファイル紐付け済み
            </span>
          ) : (
            <span className="text-amber-600 flex items-center gap-1">
              <Plus className="w-3 h-3 animate-pulse" />
              ファイルをドロップして紐付け
            </span>
          )}
          {recipient.listenerNote && <span className="truncate opacity-70">• {recipient.listenerNote}</span>}
        </div>
      </div>

      {/* Merged Stock indicator */}
      {recipient.status === "waiting" && matchingPreparedSlot && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-[10px] font-bold bg-sky-500 text-white hover:bg-sky-600 hover:text-white rounded-lg shadow-sm transition-all shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (onMerge) onMerge(recipient.id, matchingPreparedSlot.id);
          }}
        >
          統合
        </Button>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {recipient.link && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-8 h-8 rounded-lg",
                copied ? "text-emerald-500 bg-emerald-50" : "text-muted-foreground hover:text-emerald-500"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLink();
              }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-blue-500"
              onClick={(e) => e.stopPropagation()}
            >
              <a href={recipient.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </>
        )}
      </div>

      {/* Drop indicator overlay */}
      {isOver && (
        <div className="absolute inset-0 bg-blue-500/5 rounded-2xl border-2 border-blue-500 animate-pulse pointer-events-none" />
      )}
    </motion.div>
  );
}
