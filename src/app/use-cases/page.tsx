import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { LP_USE_CASES } from "@/lib/seo/lp-use-cases";
import { SITE_CONFIG } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: `利用シーン | ${SITE_CONFIG.name}`,
  description:
    "配信特典・イベント限定ファイル・だんごツール連携など、だんごシェアリンクの代表的な利用シーンを紹介します。",
  path: "/use-cases",
  keywords: [
    "配信 特典 配布",
    "ファイル 限定 リンク",
    "だんごツール 連携",
    "IRIAM 特典",
    "イベント 配布",
  ],
});

export default function UseCasesPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-2xl font-bold sm:text-3xl">利用シーン</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {SITE_CONFIG.name} は、配信者・クリエイター・イベント運営者が「誰に」「何を」届けるかを明確にしながら、ファイル配布を行うためのプラットフォームです。
        </p>

        <div className="mt-10 space-y-8">
          {LP_USE_CASES.map((item, index) => (
            <section key={item.slug} id={item.slug}>
              <GlassCard>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  シーン {index + 1}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                <p className="mt-4 text-xs text-muted-foreground">
                  関連キーワード: {item.keywords.join(" · ")}
                </p>
              </GlassCard>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <h2 className="text-lg font-semibold">まずは無料で試す</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            アカウント作成後、すぐにキャンペーンとライブラリを使えます。
          </p>
          <Button className="mt-4" asChild>
            <Link href="/register">無料で始める</Link>
          </Button>
        </div>

        <p className="mt-10">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← トップへ
          </Link>
        </p>
      </article>
    </MarketingShell>
  );
}
