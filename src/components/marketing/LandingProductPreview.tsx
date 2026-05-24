import { CheckCircle2, Link2, Music } from "lucide-react";
import { LINK_CARD_PREVIEW } from "@/lib/marketing/link-card-preview";
import { OG_LAYOUT } from "@/lib/og/og-layout";

const { mock: m, ghost: g } = OG_LAYOUT;

/** LP ヒーロー用：OG と同系統のリンクカード mock */
export function LandingProductPreview() {
  const { recipientName, fileName, fileDuration, claimUrl, statusLabel } = LINK_CARD_PREVIEW;

  return (
    <div
      className="relative mx-auto mt-12 px-2 sm:px-0"
      style={{ maxWidth: m.width + g.offsetX }}
      aria-hidden
    >
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-b from-primary/25 via-primary/8 to-transparent blur-2xl" />

      <div
        className="absolute top-8 h-[calc(100%-2rem)] rounded-2xl border border-primary/20 bg-background/35 shadow-lg"
        style={{
          left: 0,
          right: g.offsetX,
          transform: `translate(${g.offsetX}px, ${g.offsetY}px)`,
        }}
      />

      <div
        className="glass relative rounded-[20px] border border-border/80 shadow-2xl shadow-primary/15"
        style={{ padding: m.padding }}
      >
        <div className="mb-5 flex">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-2">
            <Music className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="text-sm font-medium">{fileName}</span>
            <span className="text-xs text-muted-foreground">{fileDuration}</span>
          </div>
        </div>

        <p
          className="font-extrabold tracking-tight"
          style={{ fontSize: m.recipientSize, lineHeight: 1.12 }}
        >
          {recipientName}
        </p>

        <div className="mt-4 flex items-center gap-2.5 rounded-[10px] border border-border/50 bg-[#f8faf9] px-3 py-2 dark:bg-muted/25">
          <Link2 className="size-4 shrink-0 text-primary/80" aria-hidden />
          <span className="truncate font-mono text-[13px] font-medium text-muted-foreground">
            {claimUrl}
          </span>
        </div>

        <div className="mt-[18px] inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1.5 text-xs font-semibold text-primary">
          <CheckCircle2 className="size-3.5" aria-hidden />
          {statusLabel}
        </div>
      </div>
    </div>
  );
}
