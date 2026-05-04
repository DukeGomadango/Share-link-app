"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Search, UserPlus, Users, Check, BookUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileItem } from "./types";
import { useTranslation } from "@/lib/i18n";

type RegistryRecipient = {
  id: string;
  name: string;
  tags: string[];
  platformId?: { type: string; handle: string } | null;
  status: string;
};

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
  const [createGlobal, setCreateGlobal] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"new" | "select">("new");

  // --- 名簿選択モード用 ---
  const [registry, setRegistry] = useState<RegistryRecipient[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registrySearch, setRegistrySearch] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);

  // 名簿を取得
  useEffect(() => {
    if (!isOpen) return;
    setRegistryLoading(true);
    fetch("/api/recipients")
      .then((r) => r.json())
      .then((data) => setRegistry(data as RegistryRecipient[]))
      .catch(() => setRegistry([]))
      .finally(() => setRegistryLoading(false));
  }, [isOpen]);

  // リセット
  useEffect(() => {
    if (!isOpen) {
      setRecipientName("");
      setListenerNote("");
      setCreateGlobal(true);
      setError(null);
      setSelectedRecipientId(null);
      setRegistrySearch("");
    }
  }, [isOpen]);

  const filteredRegistry = useMemo(() => {
    if (!registrySearch.trim()) return registry;
    const q = registrySearch.toLowerCase();
    return registry.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.platformId?.handle.toLowerCase().includes(q) ||
        r.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [registry, registrySearch]);

  const selectedRegistryRecipient = registry.find((r) => r.id === selectedRecipientId) || null;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "select") {
      if (!selectedRecipientId) {
        setError("名簿から受取人を選択してください。");
        return;
      }
    } else {
      const name = recipientName.trim();
      if (!name) {
        setError(t.campaigns.addRecipientValidation);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        campaignAssetIds: [],
        listenerNote: listenerNote.trim() || null,
      };

      if (mode === "select") {
        payload.recipientId = selectedRecipientId;
        // 名前は省略可能（API が名簿から自動取得）
      } else {
        payload.recipientDisplayName = recipientName.trim();
        payload.createGlobal = createGlobal;
      }

      const res = await fetch(`/api/campaigns/${campaignId}/recipient-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const canSubmit =
    mode === "select"
      ? !!selectedRecipientId && !submitting
      : !!recipientName.trim() && !submitting;

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
            onClick={() => { setMode('new'); setError(null); }}
          >
            <UserPlus className="w-3.5 h-3.5 mr-2" />
            新規作成
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 rounded-lg text-xs font-semibold ${mode === 'select' ? 'bg-background shadow-sm text-emerald-600' : 'text-muted-foreground'}`}
            onClick={() => { setMode('select'); setError(null); }}
          >
            <BookUser className="w-3.5 h-3.5 mr-2" />
            名簿から選択
          </Button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {mode === 'new' ? (
            <div className="space-y-4">
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
              </div>
              <div className="space-y-1.5">
                <label htmlFor="add-recipient-note" className="text-sm font-semibold ml-1">
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
              {/* 名簿登録オプション */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={createGlobal}
                  onChange={(e) => setCreateGlobal(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-md border-2 border-border/60 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 flex items-center justify-center transition-all shrink-0">
                  {createGlobal && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-medium">受取人名簿にも保存する</p>
                  <p className="text-[10px] text-muted-foreground">次回以降のキャンペーンでも選択できるようになります</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 検索バー */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  placeholder="名前やタグで検索..."
                  className="w-full rounded-2xl border border-border/60 bg-background/50 pl-10 pr-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-all"
                />
              </div>

              {/* 受取人リスト */}
              <div className="max-h-[240px] overflow-y-auto rounded-2xl border border-border/40 bg-background/30 divide-y divide-border/30">
                {registryLoading ? (
                  <div className="p-8 flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground">読み込み中...</p>
                  </div>
                ) : filteredRegistry.length === 0 ? (
                  <div className="p-8 flex flex-col items-center gap-2 text-center">
                    <Users className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">
                      {registry.length === 0
                        ? "名簿にはまだ受取人が登録されていません。\n「新規作成」タブから追加してください。"
                        : "検索条件に一致する受取人が見つかりません。"}
                    </p>
                  </div>
                ) : (
                  filteredRegistry.map((r) => {
                    const isSelected = selectedRecipientId === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRecipientId(isSelected ? null : r.id)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-muted/40 ${
                          isSelected ? "bg-emerald-500/10" : ""
                        }`}
                      >
                        {/* Selection indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-border/60"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400/20 to-sky-400/20 flex items-center justify-center text-xs font-bold text-foreground/70 shrink-0">
                          {r.name.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {r.platformId?.handle && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                @{r.platformId.handle}
                              </span>
                            )}
                            {r.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            r.status === "claimed"
                              ? "bg-sky-500/10 text-sky-500"
                              : r.status === "verified"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {r.status === "claimed"
                            ? "受取済"
                            : r.status === "verified"
                            ? "認証済"
                            : "待機中"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedRegistryRecipient && (
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    <span className="font-semibold">{selectedRegistryRecipient.name}</span> をこのキャンペーンに追加します
                  </p>
                </div>
              )}
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
              disabled={!canSubmit}
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
