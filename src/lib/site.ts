/**
 * サイト共通設定（OGP・sitemap・robots・JsonLd で共有）
 * 本番 URL: NEXT_PUBLIC_APP_URL（末尾スラッシュなし）
 * OGP: src/app/opengraph-image.png（Next.js ファイル規約・1200×630 推奨）
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE_CONFIG = {
  name: "だんごシェアリンク",
  /** ルート LP 向けのデフォルト title（layout の default） */
  defaultTitle:
    "だんごシェアリンク | 配信者向けファイル配布・特典リンク管理",
  /** ルート description */
  description:
    "配信者・クリエイター向けのファイル配布プラットフォーム。キャンペーン単位で特典を配り、受取人ごとに安全なリンクを発行。ライブラリ管理・受取人管理・だんごツール連携に対応。",
  /** LP 用の詳細 description（検索スニペット向け） */
  lpDescription:
    "IRIAM・YouTube などの配信者向けに、音声・画像・ZIP などをキャンペーン単位で配布。受取人ごとの限定リンク、パスキー対応、だんごツールとの連携。無料プランから始められます。",
  /** Next.js の opengraph-image ルート（動的 OG 画像） */
  ogImagePath: "/opengraph-image",
  twitterCreator: "@Dukegomadango",
} as const;

export function siteOgImageUrl(): string {
  return `${getSiteUrl()}${SITE_CONFIG.ogImagePath}`;
}
