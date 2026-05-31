"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface AnimatedHeroLineProps {
  text: string;
  className?: string;
  delay?: number;
  gradient?: boolean;
}

/**
 * Awwwards品質の文字単位時間差（Stagger）アニメーションコンポーネント
 * 1. テキストを1文字ずつ分割し、下からスライドアップ＆ブラーフェードイン
 * 2. 独自のシマーグラデーションアニメーションによる発光演出（エメラルド〜ミントグリーン〜アクアブルー）
 */
export function AnimatedHeroLine({
  text,
  className = "",
  delay = 0,
  gradient = false,
}: AnimatedHeroLineProps) {
  const chars = useMemo(() => text.split(""), [text]);
  const scale = 2; // グラデーション範囲のスケール
  const S = Math.max(scale * chars.length, 2);
  const deltaP = (100 * chars.length) / (S - 1);

  return (
    <span className={className}>
      {chars.map((char, i) => {
        const bgPosX = (100 * i) / (S - 1);

        // ブランドのエメラルド〜アクアグラデーションの定義
        const gradientClass = gradient
          ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent"
          : "";
        const gradientStyle = gradient
          ? {
              backgroundSize: `${S * 100}% 200%`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
            }
          : {};

        return (
          <motion.span
            key={`${i}-${char}`}
            initial={{ opacity: 0, y: 35, filter: "blur(6px)" }}
            animate={
              gradient
                ? {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    backgroundPosition: [
                      `${bgPosX}% 50%`,
                      `${bgPosX + deltaP}% 50%`,
                      `${bgPosX}% 50%`,
                    ],
                  }
                : {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                  }
            }
            transition={{
              opacity: { duration: 0.6, delay: delay + i * 0.035, ease: [0.16, 1, 0.3, 1] },
              y: { duration: 0.6, delay: delay + i * 0.035, ease: [0.16, 1, 0.3, 1] },
              filter: { duration: 0.6, delay: delay + i * 0.035, ease: [0.16, 1, 0.3, 1] },
              backgroundPosition: { duration: 6, ease: "easeInOut", repeat: Infinity },
            }}
            className={`inline-block ${gradientClass}`}
            style={{
              willChange: "opacity, transform, filter",
              ...gradientStyle,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        );
      })}
    </span>
  );
}
