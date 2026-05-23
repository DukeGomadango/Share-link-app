import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { SITE_CONFIG } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "利用規約",
  description: `${SITE_CONFIG.name}の利用規約。サービスの利用条件、禁止事項、免責などを記載しています。`,
  path: "/terms",
});

const LAST_UPDATED = "2026-05-23";

export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold sm:text-3xl">利用規約</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          本規約は、{SITE_CONFIG.name}（以下「本サービス」）の利用条件を定めるものです。本サービスを利用することで、本規約に同意したものとみなします。
        </p>
        <p className="mt-1 text-xs text-muted-foreground">最終改定日: {LAST_UPDATED}</p>

        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold">1. サービス内容</h2>
          <p className="text-sm text-muted-foreground">
            本サービスは、ファイルの保管・配布・受取管理を行う Web アプリケーションです。機能・料金は予告なく変更される場合があります。
          </p>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold">2. アカウント</h2>
          <p className="text-sm text-muted-foreground">
            利用者は正確な情報で登録し、認証情報を第三者に漏らさないものとします。アカウント上の行為は利用者の責任となります。
          </p>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold">3. 禁止事項</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>法令または公序良俗に反するコンテンツの配布</li>
            <li>第三者の権利（著作権・肖像権等）を侵害する利用</li>
            <li>本サービスの運営を妨害する行為、不正アクセス</li>
            <li>マルウェア・過度な負荷をかける利用</li>
          </ul>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold">4. 免責</h2>
          <p className="text-sm text-muted-foreground">
            本サービスは現状有姿で提供されます。運営者は、本サービスの中断・データ損失等により生じた損害について、法令で認められる範囲を超えて責任を負いません。
          </p>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold">5. 規約の変更</h2>
          <p className="text-sm text-muted-foreground">
            本規約は必要に応じて改定されます。重要な変更は本サービス上で告知します。
          </p>
        </section>

        <p className="mt-10">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← トップへ
          </Link>
        </p>
      </article>
    </MarketingShell>
  );
}
