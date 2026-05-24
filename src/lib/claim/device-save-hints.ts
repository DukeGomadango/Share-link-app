/** 受取画面の保存 UX 向けデバイス判定（クライアント専用） */

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/** X / LINE / Instagram などのアプリ内ブラウザの簡易判定 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Twitter/i.test(ua)) return true;
  if (/Instagram/i.test(ua)) return true;
  if (/Line\//i.test(ua)) return true;
  if (/FBAN|FBAV/i.test(ua)) return true;
  if (isIosDevice() && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) {
    return true;
  }
  return false;
}

export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export const INAPP_BANNER_STORAGE_KEY = "dango-claim-inapp-banner-dismissed";

export const BULK_SAVE_WARN_THRESHOLD = 10;
