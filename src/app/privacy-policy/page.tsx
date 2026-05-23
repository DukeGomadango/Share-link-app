import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { SITE_CONFIG } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "プライバシーポリシー",
  description: `${SITE_CONFIG.name}のプライバシーポリシー。取得する情報、利用目的、Cookie、第三者提供などを記載しています。`,
  path: "/privacy-policy",
});

const LAST_UPDATED = "2026-05-23";

export default function PrivacyPolicyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold sm:text-3xl">プライバシーポリシー</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {SITE_CONFIG.name}（以下「本サービス」）は、利用者のプライバシーを尊重し、個人情報の保護に配慮してサービスを提供します。
        </p>
        <p className="mt-1 text-xs text-muted-foreground">最終改定日: {LAST_UPDATED}</p>

        <section className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold">1. 取得する情報</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>アカウント登録時のメールアドレス、認証プロバイダ経由の識別情報</li>
            <li>プロフィール設定（表示名など、任意で入力いただく情報）</li>
            <li>アップロードされたファイルのメタデータ・実体（配布・保管のため）</li>
            <li>受取・配布に関する操作ログ（セキュリティ・不正利用対策のため）</li>
            <li>アクセス解析のための IP アドレス、ブラウザ情報、参照元、閲覧ページ等</li>
          </ul>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold">2. 利用目的</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>本サービスの提供、維持、改善</li>
            <li>認証・課金・サポート対応</li>
            <li>不正利用・セキュリティインシデントへの対応</li>
            <li>重要なお知らせや仕様変更の案内</li>
          </ul>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold">3. 第三者サービス</h2>
          <p className="text-sm text-muted-foreground">
            本サービスは、認証（Supabase）、決済（Stripe）、ファイル保管（Cloudflare R2 等）、ホスティング（Vercel）などの第三者サービスを利用します。各提供者のプライバシーポリシーもあわせてご確認ください。
          </p>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold">4. Cookie 等</h2>
          <p className="text-sm text-muted-foreground">
            ログイン状態の維持や利便性向上のため Cookie 等を利用します。ブラウザ設定で無効化できますが、一部機能が利用できなくなる場合があります。
          </p>
        </section>

        <section className="mt-6 space-y-2">
          <h2 className="text-lg font-semibold">5. お問い合わせ</h2>
          <p className="text-sm text-muted-foreground">
            本ポリシーに関するお問い合わせは、運営者までご連絡ください。
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
