"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, FileAudio, FileImage } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetBody, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { FileItem, Recipient } from "@/components/features/campaigns/types";
import { UserAvatar } from "@/components/ui/user-avatar";

type Step = "files" | "recipient" | "confirm";

type CampaignAssignWizardProps = {
  open: boolean;
  onClose: () => void;
  files: FileItem[];
  recipients: Recipient[];
  initialFileIds: Set<string>;
  initialRecipientId?: string | null;
  onAssign: (recipientId: string, fileIds: string[]) => Promise<boolean>;
  onSuccess?: () => void;
};

type CampaignAssignWizardBodyProps = Omit<CampaignAssignWizardProps, "open">;

function CampaignAssignWizardBody({
  onClose,
  files,
  recipients,
  initialFileIds,
  initialRecipientId = null,
  onAssign,
  onSuccess,
}: CampaignAssignWizardBodyProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(() =>
    initialRecipientId && initialFileIds.size > 0 ? "recipient" : "files"
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialFileIds));
  const [recipientId, setRecipientId] = useState<string | null>(initialRecipientId);
  const [busy, setBusy] = useState(false);

  const preparedRecipients = useMemo(
    () => recipients.filter((r) => r.status !== "waiting"),
    [recipients]
  );

  const selectedFiles = files.filter((f) => selectedIds.has(f.id));
  const selectedRecipient = preparedRecipients.find((r) => r.id === recipientId) ?? null;

  const resetOnClose = () => {
    onClose();
  };

  const toggleFile = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runAssign = async () => {
    if (!recipientId || selectedIds.size === 0) return;
    setBusy(true);
    try {
      const ok = await onAssign(recipientId, Array.from(selectedIds));
      if (ok) {
        onSuccess?.();
        resetOnClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const stepTitle =
    step === "files"
      ? t.mobile.assignStepFiles
      : step === "recipient"
        ? t.mobile.assignStepRecipient
        : t.mobile.assignStepConfirm;

  return (
    <>
      <SheetHeader className="px-4 pt-8 pb-2">
        <SheetTitle>{t.mobile.assignWizardTitle}</SheetTitle>
        <p className="text-sm text-muted-foreground">{stepTitle}</p>
      </SheetHeader>
      <SheetBody className="flex flex-col gap-4 px-4 pb-8">
        {step === "files" && (
          <ul className="max-h-[50dvh] space-y-2 overflow-y-auto">
            {files.map((file) => (
              <li key={file.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full min-h-14 items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    selectedIds.has(file.id)
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border/60"
                  )}
                  onClick={() => toggleFile(file.id)}
                >
                  <Checkbox checked={selectedIds.has(file.id)} aria-hidden />
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {file.type === "image" && file.previewUrl ? (
                      <Image src={file.previewUrl} alt="" fill className="object-cover" unoptimized />
                    ) : file.type === "audio" ? (
                      <FileAudio className="m-2 size-6 text-purple-500" />
                    ) : (
                      <FileImage className="m-2 size-6 text-emerald-500" />
                    )}
                  </div>
                  <span className="line-clamp-2 text-sm font-medium">{file.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {step === "recipient" && (
          <ul className="max-h-[50dvh] space-y-2 overflow-y-auto">
            {preparedRecipients.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full min-h-14 items-center gap-3 rounded-xl border p-3 text-left",
                    recipientId === r.id ? "border-sky-500/40 bg-sky-500/5" : "border-border/60"
                  )}
                  onClick={() => setRecipientId(r.id)}
                >
                  <UserAvatar name={r.name} size="sm" />
                  <span className="font-medium">{r.name}</span>
                  {recipientId === r.id ? <Check className="ml-auto size-4 text-sky-500" /> : null}
                </button>
              </li>
            ))}
          </ul>
        )}

        {step === "confirm" && selectedRecipient && (
          <div className="space-y-3 rounded-xl border border-border/60 p-4 text-sm">
            <p>
              <span className="text-muted-foreground">受取人:</span>{" "}
              <strong>{selectedRecipient.name}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">ファイル:</span>{" "}
              {t.mobile.assignSelectedFiles.replace("{count}", String(selectedFiles.length))}
            </p>
            <ul className="max-h-32 space-y-1 overflow-y-auto text-muted-foreground">
              {selectedFiles.map((f) => (
                <li key={f.id} className="truncate">
                  · {f.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 border-t border-border/40 pt-4">
          {step !== "files" ? (
            <Button
              type="button"
              variant="outline"
              size="touch"
              className="min-h-11"
              onClick={() => setStep(step === "confirm" ? "recipient" : "files")}
            >
              <ChevronLeft className="mr-1 size-4" />
              {t.common.back}
            </Button>
          ) : (
            <Button type="button" variant="outline" size="touch" className="min-h-11" onClick={resetOnClose}>
              {t.common.cancel}
            </Button>
          )}
          {step === "files" ? (
            <Button
              type="button"
              size="touch"
              className="min-h-11 flex-1"
              disabled={selectedIds.size === 0}
              onClick={() => setStep("recipient")}
            >
              {t.mobile.assignStepRecipient}
              <ChevronRight className="ml-1 size-4" />
            </Button>
          ) : step === "recipient" ? (
            <Button
              type="button"
              size="touch"
              className="min-h-11 flex-1"
              disabled={!recipientId}
              onClick={() => setStep("confirm")}
            >
              {t.mobile.assignStepConfirm}
              <ChevronRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="touch"
              className="min-h-11 flex-1 bg-emerald-500 text-white hover:bg-emerald-600"
              disabled={busy}
              onClick={() => void runAssign()}
            >
              {t.mobile.assignConfirm}
            </Button>
          )}
        </div>
      </SheetBody>
    </>
  );
}

function wizardSessionKey(initialFileIds: Set<string>, initialRecipientId?: string | null) {
  const ids = [...initialFileIds].sort().join(",");
  return `${initialRecipientId ?? ""}:${ids}`;
}

export function CampaignAssignWizard({
  open,
  onClose,
  files,
  recipients,
  initialFileIds,
  initialRecipientId = null,
  onAssign,
  onSuccess,
}: CampaignAssignWizardProps) {
  const sessionKey = wizardSessionKey(initialFileIds, initialRecipientId);

  return (
    <Sheet isOpen={open} onClose={onClose}>
      {open ? (
        <CampaignAssignWizardBody
          key={sessionKey}
          onClose={onClose}
          files={files}
          recipients={recipients}
          initialFileIds={initialFileIds}
          initialRecipientId={initialRecipientId}
          onAssign={onAssign}
          onSuccess={onSuccess}
        />
      ) : null}
    </Sheet>
  );
}
