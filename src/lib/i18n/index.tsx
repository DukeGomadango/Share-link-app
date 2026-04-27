"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { ja } from "./locales/ja";
import { en } from "./locales/en";
import type { TranslationKeys } from "./locales/ja";

// ─── 型定義 ────────────────────────────────────────────────
export type Locale = "ja" | "en";

const LOCALES: Record<Locale, TranslationKeys> = { ja, en };
const STORAGE_KEY = "share-platform-locale";
const DEFAULT_LOCALE: Locale = "ja";

// ─── Context ───────────────────────────────────────────────
interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // 初回マウント時に localStorage から復元
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && stored in LOCALES) {
      setLocaleState(stored);
    }
  }, []);

  // 言語変更時に <html lang> と localStorage を同期
  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: LOCALES[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────
export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return ctx;
}
