const DEFAULT_PROD_URL = "https://dango-tool.vercel.app";
/** だんごツール（人数カウントアプリ）のローカル dev 既定。シェアリンクは 3000 */
const DEFAULT_DEV_URL = "http://localhost:3001";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** だんごツールのフロントエンド origin（末尾スラッシュなし） */
export function resolveDangoToolBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_DANGO_TOOL_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return DEFAULT_DEV_URL;
    }
  }
  return DEFAULT_PROD_URL;
}

export function buildDangoGachaDesignUrl(campaignId: string, apiBaseUrl: string): string {
  const base = resolveDangoToolBaseUrl();
  const params = new URLSearchParams({
    campaign_id: campaignId,
    open_bulk_modal: "true",
    api_base_url: apiBaseUrl,
  });
  return `${base}/gacha?${params.toString()}`;
}

/** シェアリンク自身を指していると /gacha が 404 になる */
export function isDangoToolUrlSameOriginAsShareLink(shareLinkOrigin: string): boolean {
  try {
    return new URL(resolveDangoToolBaseUrl()).origin === new URL(shareLinkOrigin).origin;
  } catch {
    return false;
  }
}
