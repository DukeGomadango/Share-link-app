import { Link2, Mic2, ShieldCheck } from "lucide-react";

const ITEMS = [
  {
    icon: Mic2,
    title: "配信特典の配布",
    description: "IRIAM・YouTube などの返礼品音声や限定画像を、受取人ごとに安全に届けます。",
  },
  {
    icon: Link2,
    title: "だんごツール連携",
    description: "ガチャや配布フローと組み合わせ、ツールからファイル配布まで一気通貫で運用できます。",
  },
  {
    icon: ShieldCheck,
    title: "Stripe による安全な決済",
    description: "有料プランのお支払いは Stripe で処理。カード情報は当サービスに保存しません。",
  },
] as const;

export function LandingSocialProof() {
  return (
    <section className="border-y border-border/60 bg-muted/15 py-12 sm:py-14">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
        {ITEMS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
