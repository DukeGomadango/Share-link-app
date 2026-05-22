/** 連携 API・管理画面で共通のキャンペーンアセット表示名 */
export const CAMPAIGN_ASSET_UNTITLED = "無題のアイテム";

/**
 * キャンペーンアセットの表示名を1ルールで解決する。
 * 優先: label → ライブラリ originalFilename → URL 末尾 → fallback
 */
export function resolveCampaignAssetDisplayName(opts: {
  label?: string | null;
  libraryOriginalFilename?: string | null;
  assetUrl?: string | null;
  fallback?: string;
}): string {
  const fallback = opts.fallback ?? CAMPAIGN_ASSET_UNTITLED;
  const trimmedLabel = opts.label?.trim();
  if (trimmedLabel) return trimmedLabel;

  const trimmedLib = opts.libraryOriginalFilename?.trim();
  if (trimmedLib) return trimmedLib;

  const url = opts.assetUrl?.trim();
  if (url) {
    try {
      const pathname = new URL(url).pathname;
      const segment = pathname.split("/").filter(Boolean).pop();
      if (segment) return decodeURIComponent(segment);
    } catch {
      const segment = url.split("/").filter(Boolean).pop();
      if (segment) return segment;
    }
  }

  return fallback;
}
