"use client";

import { useState, useSyncExternalStore } from "react";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import {
  INAPP_BANNER_STORAGE_KEY,
  isAndroidDevice,
  isInAppBrowser,
  isIosDevice,
} from "@/lib/claim/device-save-hints";

function readBannerEligible(): boolean {
  if (!isInAppBrowser()) return false;
  try {
    return localStorage.getItem(INAPP_BANNER_STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}

export function ClaimInAppBrowserBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  const eligible = useSyncExternalStore(
    () => () => {},
    readBannerEligible,
    () => false
  );

  const visible = eligible && !dismissed;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(INAPP_BANNER_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (!visible) return null;

  const body = isIosDevice()
    ? t.claim.inAppBrowserBodyIos
    : isAndroidDevice()
      ? t.claim.inAppBrowserBodyAndroid
      : t.claim.inAppBrowserBodyIos;

  return (
    <div
      role="status"
      className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm"
    >
      <div className="flex gap-3">
        <ExternalLink className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-bold">{t.claim.inAppBrowserTitle}</p>
          <p className="text-amber-900/90 leading-relaxed">{body}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 text-amber-800 hover:bg-amber-100"
          onClick={dismiss}
          aria-label={t.claim.inAppBrowserDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
