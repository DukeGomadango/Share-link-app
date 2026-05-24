"use client";

import { Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { isAndroidDevice, isIosDevice } from "@/lib/claim/device-save-hints";

export function ClaimSaveTips() {
  const { t } = useTranslation();

  const longPressHint = isIosDevice()
    ? t.claim.longPressHintIos
    : isAndroidDevice()
      ? t.claim.longPressHintAndroid
      : `${t.claim.longPressHintIos} ${t.claim.longPressHintAndroid}`;

  return (
    <details className="group rounded-2xl border border-emerald-100/80 bg-emerald-50/40 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-bold text-emerald-800 [&::-webkit-details-marker]:hidden">
        <Info className="w-4 h-4 shrink-0" aria-hidden />
        <span>{t.claim.saveTipsTitle}</span>
        <span className="ml-auto text-xs font-medium text-emerald-600/80 group-open:hidden">
          ▼
        </span>
        <span className="ml-auto text-xs font-medium text-emerald-600/80 hidden group-open:inline">
          ▲
        </span>
      </summary>
      <div className="space-y-2 border-t border-emerald-100/60 px-4 pb-3 pt-2 text-muted-foreground leading-relaxed">
        <p>{t.claim.saveDestinationNote}</p>
        <p>{longPressHint}</p>
      </div>
    </details>
  );
}
