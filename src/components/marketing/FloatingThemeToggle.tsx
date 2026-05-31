"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * 統合ポータルヘッダーで隠れてしまうLP向けのフローティングテーマ切り替えボタン
 * - next-themes と完全連動
 * - エメラルドグリーンの光彩と Glassmorphism 質感
 * - ホバー時の拡大およびアクティブ時の縮小インタラクション
 */
export default function FloatingThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed bottom-24 right-6 z-50 size-12">
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`w-full h-full rounded-full border flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg backdrop-blur-md ${
          isDark
            ? "bg-zinc-950/75 border-white/10 text-white hover:text-primary hover:border-primary/50 shadow-black/40"
            : "bg-white/75 border-slate-200 text-slate-700 hover:text-primary hover:border-primary/50 shadow-slate-200"
        }`}
        style={{
          boxShadow: isDark
            ? "0 8px 30px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(0.645 0.165 158.452 / 0.1)"
            : "0 8px 30px oklch(0 0 0 / 0.06)",
        }}
        aria-label="テーマ切り替え"
      >
        {isDark ? (
          <Moon className="size-5 text-primary animate-pulse" />
        ) : (
          <Sun className="size-5 text-amber-500 animate-spin-slow" />
        )}
      </button>
    </div>
  );
}
