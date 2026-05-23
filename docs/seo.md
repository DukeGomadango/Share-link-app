# SEO（検索獲得）

## 方針

- **インデックス対象**: `/`・`/use-cases`・`/privacy-policy`・`/terms`
- **非インデックス**: ダッシュボード、認証、受取（`/claim`, `/receive`）、API
- 本番 URL は **`NEXT_PUBLIC_APP_URL`**（末尾スラッシュなし）で `metadataBase`・sitemap・OGP を統一

## 主要ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/site.ts` | サイト名・説明・`getSiteUrl()` |
| `src/lib/seo/page-metadata.ts` | 公開ページ用 metadata |
| `src/lib/seo/public-paths.ts` | sitemap 対象 |
| `src/lib/seo/lp-faq.ts` / `lp-use-cases.ts` | LP・構造化データ用コンテンツ |
| `src/app/robots.ts` / `sitemap.ts` | クローラ向け |
| `src/app/opengraph-image.tsx` | 動的 OG 画像（1200×630） |
| `src/components/seo/JsonLd.tsx` | 構造化データ |
| `src/components/marketing/*` | LP UI（料金は `BillingPlanColumns` marketing モード） |
| `src/components/seo/GoogleAnalytics.tsx` | GA4（任意） |

## 環境変数

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_APP_URL` | 本番オリジン（必須） |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console 所有権確認 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4（例: `G-XXXXXXXX`） |

## 本番チェックリスト

1. Vercel の `NEXT_PUBLIC_APP_URL` を本番ドメインに設定
2. [Google Search Console](https://search.google.com/search-console) でプロパティ追加
3. `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` に HTML タグの content 値を設定してデプロイ
4. Search Console から `https://<domain>/sitemap.xml` を送信
5. [リッチリザルトテスト](https://search.google.com/test/rich-results) で `/` の JSON-LD を確認
6. PageSpeed Insights で LCP / CLS を確認（LP ヒーローは CSS モックで軽量）
7. だんごツール等から本番 LP へのリンクを設置（被リンク）

## ログイン済みユーザーの `/`

認証済みは `/dashboard` へリダイレクト（`src/app/page.tsx`）。

## OG 画像の差し替え

`src/app/opengraph-image.tsx` のデザインを編集するか、従来どおり静的 PNG を使う場合は `opengraph-image.png` に差し替え（tsx がある場合は tsx が優先）。
