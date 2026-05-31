"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
import Lenis from "lenis";
import { useScroll, useTransform, motion } from "framer-motion";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { LandingProductPreview } from "@/components/marketing/LandingProductPreview";
import { LandingSocialProof } from "@/components/marketing/LandingSocialProof";
import { LandingUseCases } from "@/components/marketing/LandingUseCases";
import { MarketingPricingSection } from "@/components/marketing/MarketingPricingSection";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { LP_FAQ } from "@/lib/seo/lp-faq";
import { SITE_CONFIG } from "@/lib/site";

// 新演出コンポーネントのインポート
import WelcomeLoader from "@/components/marketing/WelcomeLoader";
import LpCustomCursor from "@/components/marketing/LpCustomCursor";
import { AnimatedHeroLine } from "@/components/marketing/AnimatedHeroLine";
import { InteractiveTransferConsole } from "@/components/marketing/InteractiveTransferConsole";
import FloatingThemeToggle from "@/components/marketing/FloatingThemeToggle";

// SSR無効化で3D WebGLキャンバスを動的ロード
const DangoShareScene = dynamic(
  () => import("@/components/marketing/three/DangoShareScene"),
  { ssr: false }
);

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
  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [is3DSceneCreated, setIs3DSceneCreated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  // デバイスのレスポンシブ判定
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lenisスムーズスクロールの初期化 (PC版のみに適用して省電力を図る)
  useEffect(() => {
    if (isMobile) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    let frameId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, [isMobile]);

  // 交差オブザーバーでアクセントラインのアニメーションを発火
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const line = entry.target.querySelector(".lp-accent-line");
          if (line) {
            if (entry.isIntersecting) {
              line.classList.add("is-visible");
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // インタラクション時に3Dオブジェクトを脈動（Pulse）させる
  const handleTransferPulse = () => {
    setPulseTrigger((prev) => prev + 1);
  };

  // 巨大タイポグラフィ用のスクロール連動パララックス＆フェードアウト (Awwwards標準)
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 5000], [0, -5000]); // 1:1等速スクロール（クランプフリーズなし）
  const fadeOpacity = useTransform(scrollY, [0, 600, 4000], [1, 0.45, 0.35]); // 等速に合わせてディミング範囲を拡張

  return (
    <div ref={containerRef} className="relative w-full min-h-screen">
      {/* 3D WebGL シーン (背景層) */}
      <DangoShareScene
        pulseTrigger={pulseTrigger}
        isMobile={isMobile}
        onCreated={() => setIs3DSceneCreated(true)}
        eventSource={containerRef}
      />

      {/* プレミアム・ウェルカムローダー */}
      <WelcomeLoader isLoadedTrigger={is3DSceneCreated} />

      {/* プレミアム・カスタムカーソルポインター (PCのみ) */}
      {!isMobile && <LpCustomCursor />}

      <MarketingShell>
        {/* ================= HERO SECTION ================= */}
        <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-28 z-10 overflow-hidden">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary sm:text-sm animate-pulse">
              <Sparkles className="size-3.5" aria-hidden />
              配信者・クリエイター向けファイル配布
            </p>

            {/* 1文字ずつの極上スライドアニメーション（元の文言を完全に復元） */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.15] mb-6">
              <AnimatedHeroLine text={SITE_CONFIG.tagline.line1} delay={0.2} />
              <br />
              <AnimatedHeroLine text={SITE_CONFIG.tagline.line2Highlight} delay={0.6} gradient={true} />
              <AnimatedHeroLine text={SITE_CONFIG.tagline.line2After} delay={0.9} />
            </h1>

            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg max-w-2xl mx-auto font-medium">
              だんごシェアリンクは、受取人ごとに専用リンクを発行してファイルを配る安全なプラットフォームです。IRIAM・YouTube
              配信の特典音声やイベント限定データの配布に完璧な安心感をプラス。
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto font-bold shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-300" asChild>
                <Link href="/register">
                  無料で始める
                  <ArrowRight className="ml-1 size-4 animate-pulse" aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold backdrop-blur-md bg-background/30" asChild>
                <Link href="/login">ログイン</Link>
              </Button>
            </div>
          </div>

          {/* プレビュー用モック */}
          <LandingProductPreview />
        </section>

        <LandingSocialProof />

        {/* ================= INTERACTIVE WORKFLOW SECTON ================= */}
        <section
          id="simulation"
          ref={(el) => { sectionRefs.current[0] = el; }}
          className="mx-auto max-w-6xl px-4 py-16 sm:py-24 z-10 relative"
        >
          <div className="mb-10 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Interactive workflow</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold mt-2 tracking-tight">
              数秒で完了する、ファイル配布体験
            </h2>
            {/* 交差オブザーバーで伸びるエメラルドのアクセントライン */}
            <div className="lp-accent-line" />
          </div>

          {/* 実際に触って体験できるドラッグ＆ドロップ疑似HUD */}
          <div onClick={handleTransferPulse}>
            <InteractiveTransferConsole />
          </div>
        </section>

        <div ref={(el) => { sectionRefs.current[1] = el; }}>
          <LandingUseCases />
        </div>

        {/* ================= FEATURES SECTION ================= */}
        <section
          id="features"
          ref={(el) => { sectionRefs.current[2] = el; }}
          className="border-t border-border/60 bg-muted/20 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Core utilities</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold mt-2 tracking-tight">
                配信運用に必要な機能
              </h2>
              <div className="lp-accent-line mx-auto" />
            </div>

            <p className="mx-auto -mt-6 mb-12 max-w-2xl text-center text-muted-foreground font-medium">
              ライブラリ・キャンペーン・受取人管理をひとつに。配布の準備から受取確認まで。
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <li key={title}>
                  <GlassCard className="h-full hover:scale-[1.02] hover:border-primary/30 transition-all duration-300">
                    <Icon className="size-8 text-primary mb-3" aria-hidden />
                    <h3 className="mt-3 font-bold text-base">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </GlassCard>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ================= PRICING SECTION ================= */}
        <section
          id="pricing"
          ref={(el) => { sectionRefs.current[3] = el; }}
          className="py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Transparent pricing</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold mt-2 tracking-tight">
                料金プラン
              </h2>
              <div className="lp-accent-line mx-auto" />
            </div>

            <p className="mx-auto -mt-6 mb-12 max-w-xl text-center text-sm text-muted-foreground font-medium">
              まずは無料プランで試し、必要に応じて Pro またはサポーターへ。
            </p>
            <div className="mt-10">
              <MarketingPricingSection />
            </div>
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section
          id="faq"
          ref={(el) => { sectionRefs.current[4] = el; }}
          className="border-t border-border/60 bg-muted/20 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">FAQ</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold mt-2 tracking-tight">
                よくある質問
              </h2>
              <div className="lp-accent-line mx-auto" />
            </div>

            <dl className="mt-10 space-y-6">
              {LP_FAQ.map((item) => (
                <div key={item.question} className="p-5 rounded-2xl bg-background/50 border border-border/60 hover:border-primary/20 transition-all duration-300">
                  <dt className="font-bold text-foreground text-sm sm:text-base">{item.question}</dt>
                  <dd className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground font-medium">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ================= CTA SECTION ================= */}
        <section className="pb-24 pt-16 z-10 relative">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight">配布を、もっとシンプルに</h2>
            <p className="mt-3 text-muted-foreground font-medium">
              アカウント作成はメールの確認コードだけ。数分で最初のキャンペーンを作れます。
            </p>
            <Button size="lg" className="mt-8 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30" asChild>
              <Link href="/register">今すぐ無料で始める</Link>
            </Button>
          </div>
        </section>
      </MarketingShell>
      
      {/* 画面左端の縦型巨大タイポグラフィ (PC版限定・視差パララックス＆動的フェードアウト・Awwwards極細アウトライン) */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 150 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.8,
            ease: [0.16, 1, 0.3, 1], // 超スムーズな極上デセラレーション
            delay: 1.2, // ローダーの終了タイミングとシンクロ
          }}
          className="fixed left-[5vw] top-[2vh] pointer-events-none select-none z-10 hidden md:flex"
        >
          <motion.div
            style={{
              y: parallaxY,
              opacity: fadeOpacity,
              rotate: 90,
              transformOrigin: "left center",
            }}
            aria-hidden
          >
            <span
              className="text-[9vw] lg:text-[10vw] font-black uppercase tracking-[0.2em] leading-none whitespace-nowrap select-none"
              style={{
                WebkitTextStroke: "3px var(--hero-outline)",
                color: "transparent",
              }}
            >
              DANGO SHARE LINK
            </span>
          </motion.div>
        </motion.div>
      )}

      {/* プレミアム・フローティングテーマ切り替えボタン */}
      <FloatingThemeToggle />
    </div>
  );
}
