"use client";

import { useState } from "react";
import { X, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FileItem } from "./types";
import { useTranslation } from "@/lib/i18n";

interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  poolFiles: FileItem[];
  onIssued: () => void | Promise<void>;
}

export function AddRecipientModal({
  isOpen,
  onClose,
  campaignId,
  poolFiles,
  onIssued,
}: AddRecipientModalProps) {
  const { t } = useTranslation();
  const [recipientName, setRecipientName] = useState("");
  const [listenerNote, setListenerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"new" | "select">("new");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = recipientName.trim();
    if (!name) {
      setError(t.campaigns.addRecipientValidation);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/recipient-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignAssetIds: [], // モーダルでは紐づけを行わない設計に変更
          recipientDisplayName: name,
          listenerNote: listenerNote.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setError(data.message ?? data.error ?? t.campaigns.addRecipientError);
        return;
      }
      await onIssued();
      onClose();
    } catch {
      setError(t.campaigns.addRecipientError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass p-8 rounded-[2rem] shadow-2xl border border-border/50 animate-in fade-in zoom-in-95 duration-200">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6 rounded-full text-muted-foreground hover:bg-muted"
          type="button"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
        
        <h2 className="text-2xl font-bold mb-1 tracking-tight">受取人を追加</h2>
        <p className="text-sm text-muted-foreground mb-8">キャンペーンの配布対象となるリスナーを登録します。</p>

        <div className="flex p-1 bg-muted/50 rounded-xl mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 rounded-lg text-xs font-semibold ${mode === 'new' ? 'bg-background shadow-sm text-emerald-600' : 'text-muted-foreground'}`}
            onClick={() => setMode('new')}
          >
            <UserPlus className="w-3.5 h-3.5 mr-2" />
            新規作成
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 rounded-lg text-xs font-semibold ${mode === 'select' ? 'bg-background shadow-sm text-emerald-600' : 'text-muted-foreground'}`}
            onClick={() => setMode('select')}
          >
            <Search className="w-3.5 h-3.5 mr-2" />
            名簿から選択
          </Button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {mode === 'new' ? (
            <div className="space-y-1.5">
              <label htmlFor="add-recipient-name" className="text-sm font-semibold ml-1">
                名前
              </label>
              <input
                id="add-recipient-name"
                type="text"
                autoComplete="off"
                maxLength={200}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="リスナーの名前を入力..."
                className="w-full rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-all"
              />
              <label htmlFor="add-recipient-note" className="text-sm font-semibold ml-1 mt-4 block">
                識別用メモ（任意）
              </label>
              <input
                id="add-recipient-note"
                type="text"
                autoComplete="off"
                maxLength={300}
                value={listenerNote}
                onChange={(e) => setListenerNote(e.target.value)}
                placeholder="@や通称など、同名との区別に使うメモ"
                className="w-full rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-all"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold ml-1">受取人を選択</label>
              <select className="w-full rounded-2xl border border-border/60 bg-background/50 px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 appearance-none">
                <option value="">過去の受取人から選ぶ...</option>
                <option value="1">山田 太郎</option>
                <option value="2">佐藤 花子</option>
              </select>
              <p className="text-[10px] text-muted-foreground ml-1 italic">※ 「受取人タブ」で作成した名簿から追加できます。</p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed italic">
              ※ 追加した後は、メイン画面の「ファイルプール」からドラッグ＆ドロップでファイルを配ることができます。
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive animate-in shake-200">
              <X className="w-4 h-4" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1 rounded-2xl h-12" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={submitting || (mode === 'new' && !recipientName)}
              className="flex-[2] bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl h-12 shadow-lg shadow-emerald-500/20 font-bold"
            >
              {submitting ? "登録中..." : "受取人を追加"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
