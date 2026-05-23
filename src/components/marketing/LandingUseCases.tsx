import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { LP_USE_CASES } from "@/lib/seo/lp-use-cases";

export function LandingUseCases() {
  return (
    <section id="use-cases" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">こんな使い方</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              配信者・イベント運営・だんごツール連携など、よくあるシーンに合わせて設計されています。
            </p>
          </div>
          <Link
            href="/use-cases"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            利用シーンをもっと見る
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {LP_USE_CASES.map((item) => (
            <li key={item.slug}>
              <GlassCard className="h-full">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </GlassCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
