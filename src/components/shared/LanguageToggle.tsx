"use client";

import { Globe } from "lucide-react";
import { useTranslation, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "ja", label: "JP" },
  { value: "en", label: "EN" },
];

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-full bg-muted/60 border border-border/40",
        className
      )}
    >
      <Globe className="w-3.5 h-3.5 text-muted-foreground ml-1 shrink-0" />
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setLocale(value)}
          aria-pressed={locale === value}
          aria-label={`Switch to ${value === "ja" ? "Japanese" : "English"}`}
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full transition-all duration-200",
            locale === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
