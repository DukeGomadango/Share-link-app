"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTranslation } from "@/lib/i18n";

const ANCHORS = [
  { href: "#use-cases", labelJa: "利用シーン", labelEn: "Use cases" },
  { href: "#features", labelJa: "機能", labelEn: "Features" },
  { href: "#pricing", labelJa: "料金", labelEn: "Pricing" },
  { href: "#faq", labelJa: "よくある質問", labelEn: "FAQ" },
] as const;

export function MarketingMobileNav() {
  const [open, setOpen] = useState(false);
  const { locale } = useTranslation();

  const close = () => setOpen(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-11 shrink-0 sm:hidden"
        onClick={() => setOpen(true)}
        aria-label={locale === "ja" ? "メニューを開く" : "Open menu"}
        aria-haspopup="dialog"
      >
        <Menu className="size-5" aria-hidden />
      </Button>
      <Sheet isOpen={open} onClose={close}>
        <SheetHeader className="px-6 pt-8 pb-2">
          <div className="flex items-center justify-between pr-8">
            <SheetTitle>{locale === "ja" ? "メニュー" : "Menu"}</SheetTitle>
            <button
              type="button"
              onClick={close}
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label={locale === "ja" ? "閉じる" : "Close"}
            >
              <X className="size-5" />
            </button>
          </div>
        </SheetHeader>
        <SheetBody className="px-4 pb-10">
          <nav className="flex flex-col gap-1" aria-label={locale === "ja" ? "ページ内リンク" : "On-page links"}>
            {ANCHORS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={close}
                className="flex min-h-11 items-center rounded-xl px-4 text-base font-medium text-foreground/90 hover:bg-muted"
              >
                {locale === "ja" ? item.labelJa : item.labelEn}
              </a>
            ))}
          </nav>
        </SheetBody>
      </Sheet>
    </>
  );
}
