"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [campaignAssetId, setCampaignAssetId] = useState(
    () => poolFiles[0]?.id ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = recipientName.trim();
    if (!name || !campaignAssetId) {
      setError(t.campaigns.addRecipientValidation);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/recipient-claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignAssetId,
          recipientDisplayName: name,
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

  const disabled = poolFiles.length === 0 || submitting;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass p-6 rounded-3xl shadow-2xl border border-border/50">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 rounded-full text-muted-foreground hover:bg-muted"
          type="button"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold mb-1">{t.campaigns.addRecipientTitle}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t.campaigns.addRecipientDescription}</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="add-recipient-name" className="text-sm font-medium block mb-1.5">
              {t.campaigns.addRecipientNameLabel}
            </label>
            <input
              id="add-recipient-name"
              type="text"
              autoComplete="off"
              maxLength={200}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={t.campaigns.addRecipientNamePlaceholder}
              className="w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            />
          </div>
          <div>
            <label htmlFor="add-recipient-asset" className="text-sm font-medium block mb-1.5">
              {t.campaigns.addRecipientAssetLabel}
            </label>
            <select
              id="add-recipient-asset"
              value={campaignAssetId}
              onChange={(e) => setCampaignAssetId(e.target.value)}
              disabled={poolFiles.length === 0}
              className="w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-50"
            >
              {poolFiles.length === 0 ? (
                <option value="">{t.campaigns.addRecipientNoPool}</option>
              ) : (
                poolFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {error && (
            <p className="text-sm text-destructive border border-destructive/30 rounded-lg px-3 py-2 bg-destructive/5">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="glass" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={disabled}
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              {submitting ? t.campaigns.addRecipientSubmitting : t.campaigns.addRecipientSubmit}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
