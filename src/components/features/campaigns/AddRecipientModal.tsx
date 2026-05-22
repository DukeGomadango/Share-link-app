"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { X, Search, UserPlus, Users, Check, BookUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FileItem, Recipient } from "./types";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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
  existingRecipients: Recipient[];
  onIssued: () => void | Promise<void>;
}

export function AddRecipientModal({
  isOpen,
  onClose,
  campaignId,
  poolFiles: _poolFiles,
  existingRecipients,
  onIssued,
}: AddRecipientModalProps) {
  const { t } = useTranslation();
  const [recipientName, setRecipientName] = useState("");
  const [bulkNamesList, setBulkNamesList] = useState<string[]>([]);
  const [bulkInput, setBulkInput] = useState("");
  const [isBulk, setIsBulk] = useState(false);
  const [listenerNote, setListenerNote] = useState("");
  const [createGlobal, setCreateGlobal] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"new" | "select">("new");

  const bulkInputRef = useRef<HTMLInputElement>(null);

  // --- 名簿選択モード用 ---
  const [registry, setRegistry] = useState<RegistryRecipient[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registrySearch, setRegistrySearch] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);

  // 名簿を取得
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setRegistryLoading(true);
      try {
        const r = await fetch("/api/recipients");
        if (!r.ok) throw new Error(String(r.status));
        const data = (await r.json()) as RegistryRecipient[];
        if (!cancelled) setRegistry(data);
      } catch {
        if (!cancelled) setRegistry([]);
      } finally {
        if (!cancelled) setRegistryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleClose = () => {
    setRecipientName("");
    setBulkNamesList([]);
    setBulkInput("");
    setIsBulk(false);
    setListenerNote("");
    setCreateGlobal(true);
    setError(null);
    setSelectedRecipientId(null);
    setRegistrySearch("");
    onClose();
  };

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

  const existingIds = useMemo(() => {
    return new Set(existingRecipients.map((r) => r.globalRecipientId || r.id));
  }, [existingRecipients]);

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
      const name = isBulk ? (bulkNamesList.length > 0 || bulkInput.trim()) : recipientName.trim();
      if (!name) {
        setError(isBulk ? "名前を入力してください。" : t.campaigns.addRecipientValidation);
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
      } else if (isBulk) {
        // 一括追加
        const finalNames = Array.from(new Set([
          ...bulkNamesList,
          ...(bulkInput.trim() ? [bulkInput.trim()] : [])
        ])).filter(Boolean);

        if (finalNames.length === 0) {
          setError("名前を入力してください。");
          return;
        }
        
        const res = await fetch(`/api/campaigns/${campaignId}/recipient-slots/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            names: finalNames,
            listenerNote: listenerNote.trim() || null,
            createGlobal,
            campaignAssetIds: [],
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        if (!res.ok) {
          setError(data.message ?? data.error ?? t.campaigns.addRecipientError);
          return;
        }
        await onIssued();
        handleClose();
        return;
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
      handleClose();
    } catch {
      setError(t.campaigns.addRecipientError);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    mode === "select"
      ? !!selectedRecipientId && !submitting
      : (isBulk ? (bulkNamesList.length > 0 || !!bulkInput.trim()) : !!recipientName.trim()) && !submitting;

  // --- スマート・チップ用ロジック ---
  const handleBulkInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = bulkInput.trim().replace(/,$/, "");
      if (val && !bulkNamesList.includes(val)) {
        setBulkNamesList((prev) => [...prev, val]);
        setBulkInput("");
      } else {
        setBulkInput("");
      }
    } else if (e.key === "Backspace" && !bulkInput && bulkNamesList.length > 0) {
      setBulkNamesList((prev) => prev.slice(0, -1));
    }
  };

  const handleBulkInputPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const newNames = text
      .split(/[\n,]/)
      .map((n) => n.trim())
      .filter((n) => n && !bulkNamesList.includes(n));
    
    if (newNames.length > 0) {
      setBulkNamesList((prev) => Array.from(new Set([...prev, ...newNames])));
      setBulkInput("");
    }
  };

  const handleBulkInputBlur = () => {
    const val = bulkInput.trim().replace(/,$/, "");
    if (val && !bulkNamesList.includes(val)) {
      setBulkNamesList((prev) => [...prev, val]);
      setBulkInput("");
    }
  };

  const removeBulkName = (index: number) => {
    setBulkNamesList((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass p-8 rounded-[2rem] shadow-2xl border border-border/50 animate-in fade-in zoom-in-95 duration-200">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-6 rounded-full text-muted-foreground hover:bg-muted"
          type="button"
          onClick={handleClose}
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
            {t.campaigns.directInput}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 rounded-lg text-xs font-semibold ${mode === 'select' ? 'bg-background shadow-sm text-emerald-600' : 'text-muted-foreground'}`}
            onClick={() => { setMode('select'); setError(null); }}
          >
            <BookUser className="w-3.5 h-3.5 mr-2" />
            {t.campaigns.selectFromRegistry}
          </Button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          {mode === 'new' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-sm font-semibold">名前</label>
                <div className="flex bg-muted/50 p-0.5 rounded-lg border border-border/40 scale-90 origin-right">
                  <button
                    type="button"
                    onClick={() => setIsBulk(false)}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                      !isBulk ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.campaigns.individualAdd}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulk(true)}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                      isBulk ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.campaigns.bulkAdd}
                  </button>
                </div>
              </div>

              {isBulk ? (
                <div className="space-y-1.5">
                  <div 
                    className="w-full rounded-2xl border border-border/60 bg-background/50 px-3 py-1.5 min-h-[48px] max-h-[200px] focus-within:ring-2 focus-within:ring-emerald-500/40 transition-all flex flex-wrap gap-1.5 content-start cursor-text overflow-y-auto scrollbar-thin"
                    onClick={() => bulkInputRef.current?.focus()}
                  >
                    {bulkNamesList.map((name, i) => (
                      <div 
                        key={`${name}-${i}`} 
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-700 rounded-lg border border-emerald-500/20 text-[11px] font-bold animate-in zoom-in-95 group/chip hover:bg-emerald-500/20 transition-colors"
                      >
                        <span className="max-w-[120px] truncate">{name}</span>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); removeBulkName(i); }} 
                          className="hover:bg-emerald-500/30 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <input
                      ref={bulkInputRef}
                      type="text"
                      autoComplete="off"
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      onKeyDown={handleBulkInputKeyDown}
                      onPaste={handleBulkInputPaste}
                      onBlur={handleBulkInputBlur}
                      placeholder={bulkNamesList.length === 0 ? t.campaigns.bulkAddPlaceholder : ""}
                      className="flex-1 min-w-[80px] bg-transparent outline-none py-1 text-sm"
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[9px] text-muted-foreground opacity-70">
                      {t.campaigns.bulkAddHint}
                    </p>
                    {bulkNamesList.length > 0 && (
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                        {bulkNamesList.length} 名
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
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
              )}
              <div className="space-y-1.5">
                <label htmlFor="add-recipient-note" className="text-sm font-semibold ml-1">
                  {isBulk ? t.campaigns.commonNote : t.campaigns.addRecipientNameLabel}
                </label>
                <input
                  id="add-recipient-note"
                  type="text"
                  autoComplete="off"
                  maxLength={300}
                  value={listenerNote}
                  onChange={(e) => setListenerNote(e.target.value)}
                  placeholder={isBulk ? t.campaigns.commonNotePlaceholder : t.campaigns.addRecipientNamePlaceholder}
                  className="w-full rounded-2xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition-all"
                />
              </div>
              {/* 名簿登録オプション */}
              <label className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/30 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={createGlobal}
                  onChange={(e) => setCreateGlobal(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 rounded border-2 border-border/60 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 flex items-center justify-center transition-all shrink-0">
                  {createGlobal && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-medium">受取人名簿にも保存する</p>
                  <p className="text-[9px] text-muted-foreground">次回以降も選択可能になります</p>
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
                    const isAlreadyInCampaign = existingIds.has(r.id);

                    return (
                      <button
                        key={r.id}
                        type="button"
                        disabled={isAlreadyInCampaign}
                        onClick={() => setSelectedRecipientId(isSelected ? null : r.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 flex items-center gap-3 transition-colors",
                          isSelected ? "bg-emerald-500/10" : isAlreadyInCampaign ? "opacity-50 cursor-not-allowed bg-muted/20" : "hover:bg-muted/40"
                        )}
                      >
                        {/* Selection indicator */}
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                            isSelected
                              ? "border-emerald-500 bg-emerald-500"
                              : isAlreadyInCampaign
                              ? "border-muted bg-muted"
                              : "border-border/60"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                          {isAlreadyInCampaign && <Check className="w-3 h-3 text-muted-foreground" />}
                        </div>

                        {/* Avatar */}
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          isAlreadyInCampaign 
                            ? "bg-muted text-muted-foreground" 
                            : "bg-gradient-to-br from-emerald-400/20 to-sky-400/20 text-foreground/70"
                        )}>
                          {r.name.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium truncate", isAlreadyInCampaign && "text-muted-foreground")}>
                            {r.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {r.platformId?.handle && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                @{r.platformId.handle}
                              </span>
                            )}
                            {isAlreadyInCampaign && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 font-bold">
                                追加済み
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status badge */}
                        {!isAlreadyInCampaign && (
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
                        )}
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
            <Button type="button" variant="ghost" className="flex-1 rounded-2xl h-12" onClick={handleClose}>
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
