"use client";

import { Users, MailPlus } from "lucide-react";
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 text-emerald-500 hover:text-emerald-600"
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
        isPublic ? "block" : "grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max"
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
