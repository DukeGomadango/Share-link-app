"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CollapsibleCalloutProps = {
  title: string;
  children: React.ReactNode;
  /** localStorage に `1` を保存して非表示にする */
  dismissStorageKey?: string;
  defaultOpen?: boolean;
  className?: string;
  tone?: "emerald" | "neutral";
};

export function CollapsibleCallout({
  title,
  children,
  dismissStorageKey,
  defaultOpen = false,
  className,
  tone = "emerald",
}: CollapsibleCalloutProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [dismissed, setDismissed] = useState(() => {
    if (!dismissStorageKey || typeof window === "undefined") return false;
    try {
      return localStorage.getItem(dismissStorageKey) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    if (dismissStorageKey) {
      try {
        localStorage.setItem(dismissStorageKey, "1");
      } catch {
        /* ignore */
      }
    }
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border text-sm",
        tone === "emerald"
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-border/60 bg-muted/30",
        className
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          className="flex min-h-11 flex-1 items-center gap-2 text-left font-semibold"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <ChevronDown
            className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
            aria-hidden
          />
          <span className="line-clamp-2">{title}</span>
        </button>
        {dismissStorageKey ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            onClick={dismiss}
            aria-label="閉じる"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      {open ? <div className="border-t border-border/30 px-3 py-3 leading-relaxed">{children}</div> : null}
    </div>
  );
}
