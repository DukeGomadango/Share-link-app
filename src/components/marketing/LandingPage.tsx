import Link from "next/link";
import {
  ArrowRight,
  Fingerprint,
  FolderOpen,
  Link2,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { LandingProductPreview } from "@/components/marketing/LandingProductPreview";
import { LandingSocialProof } from "@/components/marketing/LandingSocialProof";
import { LandingUseCases } from "@/components/marketing/LandingUseCases";
import { MarketingPricingSection } from "@/components/marketing/MarketingPricingSection";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { LP_FAQ } from "@/lib/seo/lp-faq";
import { SITE_CONFIG } from "@/lib/site";

const FEATURES = [
  {
    icon: FolderOpen,
    title: "ライブラリで一元管理",
    description:
      "音声・画像・ZIP などをアップロードし、キャンペーンへドラッグ＆ドロップで割り当て。配布物の整理がひと目で分かります。",
  },
  {
    icon: Users,
    title: "受取人ごとの限定リンク",
    description:
      "受取人カードにファイルをドロップすると、本人専用の請求リンクを自動発行。誤配布を防ぎながらスムーズに配れます。",
  },
  {
    icon: Shield,
    title: "セキュリティを標準装備",
    description:
      "配布設定に応じた本人確認やパスキー対応。大切な特典データを、意図した相手だけが受け取れます。",
  },
  {
    icon: Link2,
    title: "だんごツールと連携",
    description:
      "ガチャや配布フローと組み合わせ、だんごツールからファイル配布まで一気通貫。配信・イベント運用に最適です。",
  },
  {
    icon: Fingerprint,
    title: "受取側もスムーズ",
    description:
      "受取ページはモバイルでも見やすく。コレクション機能で過去のギフトをまとめて確認できます。",
  },
  {
    icon: Zap,
    title: "ダッシュボードで状況把握",
    description:
      "配布状況・次のアクションをカードで可視化。忙しい配信前でも、やるべきことがすぐ分かります。",
  },
] as const;

export function LandingPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:text-sm">
            <Sparkles className="size-3.5" aria-hidden />
            配信者・クリエイター向けファイル配布
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl sm:leading-tight">
            {SITE_CONFIG.tagline.line1}
            <span className="text-primary">{SITE_CONFIG.tagline.line2Highlight}</span>
            {SITE_CONFIG.tagline.line2After}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            だんごシェアリンクは、受取人ごとに専用リンクを発行してファイルを配るプラットフォームです。IRIAM・YouTube
            配信の特典音声、イベント限定データの配布にも。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/register">
                無料で始める
                <ArrowRight className="ml-1 size-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/login">ログイン</Link>
            </Button>
          </div>
        </div>
        <LandingProductPreview />
      </section>

      <LandingSocialProof />

      <LandingUseCases />

      <section id="features" className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">配信運用に必要な機能</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            ライブラリ・キャンペーン・受取人管理をひとつに。配布の準備から受取確認まで。
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title}>
                <GlassCard className="h-full">
                  <Icon className="size-8 text-primary" aria-hidden />
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </GlassCard>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">料金</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
            アプリ内と同じ3カラム表示です。まずは無料プランで試し、必要に応じて Pro またはサポーターへ。
          </p>
          <div className="mt-10">
            <MarketingPricingSection />
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-border/60 bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">よくある質問</h2>
          <dl className="mt-10 space-y-6">
            {LP_FAQ.map((item) => (
              <div key={item.question}>
                <dt className="font-semibold">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="pb-20 pt-4">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold">配布を、もっとシンプルに</h2>
          <p className="mt-3 text-muted-foreground">
            アカウント作成はメールの確認コードだけ。数分で最初のキャンペーンを作れます。
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">今すぐ無料で始める</Link>
          </Button>
        </div>
      </section>
    </MarketingShell>
  );
}
