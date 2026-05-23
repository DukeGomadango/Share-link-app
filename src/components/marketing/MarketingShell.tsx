import Link from "next/link";
import { Gift } from "lucide-react";
import { MarketingHeaderActions } from "@/components/marketing/MarketingHeaderActions";
import { SITE_CONFIG } from "@/lib/site";

export function MarketingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.645_0.165_158.452/0.18),transparent)]"
        aria-hidden
      />
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Gift className="size-4" aria-hidden />
            </span>
            <span>{SITE_CONFIG.name}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex" aria-label="メイン">
            <a href="#use-cases" className="hover:text-foreground transition-colors">
              利用シーン
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              機能
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              料金
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              よくある質問
            </a>
          </nav>
          <MarketingHeaderActions />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {SITE_CONFIG.name}</p>
          <nav className="flex flex-wrap gap-4" aria-label="フッター">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              利用規約
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              ログイン
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
