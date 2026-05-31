"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeLoaderProps {
  onFadeOutComplete?: () => void;
  isLoadedTrigger?: boolean;
}

/**
  * Awwwards級エメラルドウェルカムローダー:
  * 1. 3つの異なるエメラルドトーンの球体（スフィア）が時間差で跳ねる
  * 2. 球体が中央に集束し、光輝く1つのだんごシェアマークへと統合
  * 3. 画面下部の進捗バーが100%になり、フェードアウト
  */
export default function WelcomeLoader({
  onFadeOutComplete,
  isLoadedTrigger = false,
}: WelcomeLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [phase, setPhase] = useState<"bounce" | "merge" | "reveal">("bounce");
  const [progress, setProgress] = useState(0);

  const handleComplete = useCallback(() => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    try {
      sessionStorage.setItem("sharelink-lp-visited", "true");
    } catch {
      // Fallback
    }
  }, [isFadingOut]);

  useEffect(() => {
    let frameId: number;

    try {
      const hasVisited = sessionStorage.getItem("sharelink-lp-visited");
      if (!hasVisited) {
        frameId = requestAnimationFrame(() => {
          setMounted(true);
          setShouldShow(true);
        });
      } else {
        frameId = requestAnimationFrame(() => {
          setMounted(true);
        });
        if (onFadeOutComplete) onFadeOutComplete();
      }
    } catch {
      frameId = requestAnimationFrame(() => {
        setMounted(true);
        setShouldShow(true);
      });
    }

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [onFadeOutComplete]);

  // 進捗率のアニメーション
  useEffect(() => {
    if (!shouldShow) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [shouldShow]);

  // フェーズの進行
  useEffect(() => {
    if (!shouldShow) return;

    const mergeTimer = setTimeout(() => {
      setPhase("merge");
    }, 1200);

    const revealTimer = setTimeout(() => {
      setPhase("reveal");
    }, 2000);

    return () => {
      clearTimeout(mergeTimer);
      clearTimeout(revealTimer);
    };
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow) return;

    const timeoutId = setTimeout(() => {
      handleComplete();
    }, 3200);

    let frameId: number;
    if (isLoadedTrigger && phase === "reveal") {
      frameId = requestAnimationFrame(() => {
        handleComplete();
      });
    }

    return () => {
      clearTimeout(timeoutId);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [shouldShow, isLoadedTrigger, handleComplete, phase]);

  if (!mounted || !shouldShow) return null;

  // エメラルド系のカラー定義 [色、発光、遅延]
  const dangoBalls = [
    { color: "oklch(0.645 0.165 158.452)", glow: "rgba(16, 230, 120, 0.4)", delay: 0 },
    { color: "oklch(0.75 0.12 165.0)", glow: "rgba(52, 211, 153, 0.35)", delay: 0.15 },
    { color: "oklch(0.55 0.14 150.0)", glow: "rgba(5, 150, 105, 0.3)", delay: 0.3 },
  ];

  return (
    <AnimatePresence
      onExitComplete={() => {
        if (onFadeOutComplete) onFadeOutComplete();
      }}
    >
      {!isFadingOut && (
        <motion.div
          key="welcome-loader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.015,
            filter: "blur(16px)",
            transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0f0d] select-none"
        >
          {/* 背景の極薄オーラ */}
          <div className="absolute w-[350px] h-[350px] rounded-full bg-primary/4 blur-[100px] pointer-events-none" />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[200px] h-[200px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none"
          />

          {/* スフィアのコンテナ */}
          <div className="relative flex flex-col items-center justify-center mb-8 h-32">
            <div
              className={`relative flex items-center justify-center ${
                phase === "merge" || phase === "reveal" ? "" : "gap-4"
              }`}
            >
              {dangoBalls.map((ball, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.3, y: 40 }}
                  animate={
                    phase === "bounce"
                      ? {
                          opacity: 1,
                          scale: 1,
                          y: [0, -24, 0],
                          scaleX: [1, 0.9, 1.1, 1],
                          scaleY: [1, 1.1, 0.9, 1],
                        }
                      : phase === "merge"
                      ? {
                          opacity: 1,
                          scale: 0.85,
                          y: 0,
                          x: 0,
                          scaleX: 1,
                          scaleY: 1,
                        }
                      : {
                          opacity: [1, 0],
                          scale: [0.85, 1.15],
                          y: 0,
                        }
                  }
                  transition={
                    phase === "bounce"
                      ? {
                          opacity: { duration: 0.4, delay: ball.delay },
                          scale: { duration: 0.4, delay: ball.delay },
                          y: { duration: 0.75, repeat: Infinity, ease: "easeInOut", delay: ball.delay },
                          scaleX: { duration: 0.75, repeat: Infinity, ease: "easeInOut", delay: ball.delay },
                          scaleY: { duration: 0.75, repeat: Infinity, ease: "easeInOut", delay: ball.delay },
                        }
                      : phase === "merge"
                      ? { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
                      : { duration: 0.4, ease: "easeOut" }
                  }
                  className="w-8 h-8 rounded-full absolute"
                  style={{
                    background: ball.color,
                    boxShadow: `0 0 20px ${ball.glow}`,
                    left: phase === "merge" || phase === "reveal" ? "calc(50% - 16px)" : `${(i - 1) * 44}px`,
                  }}
                />
              ))}
            </div>

            {/* だんごシェアリンクのシンボル（revealフェーズ） */}
            <AnimatePresence>
              {phase === "reveal" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.75, filter: "blur(6px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute flex items-center justify-center"
                >
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="28" stroke="oklch(0.645 0.165 158.452 / 0.25)" strokeWidth="1.5" />
                    {/* つながるだんごリンクのマーク */}
                    <circle cx="32" cy="18" r="8" fill="oklch(0.645 0.165 158.452)" />
                    <circle cx="20" cy="42" r="8" fill="oklch(0.75 0.12 165.0)" />
                    <circle cx="44" cy="42" r="8" fill="oklch(0.55 0.14 150.0)" />
                    <line x1="24.5" y1="23.5" x2="15.5" y2="36.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                    <line x1="39.5" y1="23.5" x2="48.5" y2="36.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                    <line x1="28" y1="42" x2="36" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ブランドタイトル */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={phase === "reveal" ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2.5 text-center z-10"
          >
            <h2 className="text-lg font-black tracking-[0.25em] text-zinc-100 font-sans uppercase">
              DANGO SHARE LINK
            </h2>
            <p className="text-[11px] text-zinc-500 font-mono tracking-widest uppercase">
              Establishing Secure Gateway...
            </p>
          </motion.div>

          {/* 進捗プログレスバー */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-40">
            <div className="h-[2px] rounded-full bg-white/5 overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-100 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, oklch(0.645 0.165 158.452), oklch(0.75 0.12 165.0))",
                  boxShadow: "0 0 10px oklch(0.645 0.165 158.452 / 0.5)",
                }}
              />
            </div>
            <div className="text-center text-[10px] text-zinc-500 font-mono mt-2 tracking-wider">
              {progress}%
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
