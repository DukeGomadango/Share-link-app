"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";

export function MarketingHeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">ログイン</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/register">無料で始める</Link>
      </Button>
    </div>
  );
}
