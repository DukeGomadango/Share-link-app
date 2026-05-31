"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Awwwardsクオリティのカスタムカーソル
 * - マウス位置に対してスプリング補間（Lerp）による滑らかな追従
 * - リンクやインタラクティブ要素ホバー時に輪が拡大＆エメラルド発光
 * - モバイル/タッチデバイス時は自動無効化
 */
export default function LpCustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const [isMobile, setIsMobile] = useState(true);

  // デバイス入力形式の検知
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setIsMobile(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // 滑らかなアニメーションループ
  useEffect(() => {
    if (isMobile) return;

    const animate = () => {
      const lerp = 0.15;
      posRef.current.x += (targetRef.current.x - posRef.current.x) * lerp;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * lerp;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!cursorRef.current) return;

      const interactive = target.closest("a, button, [role='button'], .lp-cursor-expand");
      
      if (interactive) {
        cursorRef.current.classList.add("lp-custom-cursor-hover");
      } else {
        cursorRef.current.classList.remove("lp-custom-cursor-hover");
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseover", handleMouseOver, { passive: true });

    rafRef.current = requestAnimationFrame(animate);

    // CSSで元のカーソルを隠す設定
    const styleElement = document.createElement("style");
    styleElement.id = "custom-cursor-hide-native";
    styleElement.innerHTML = `
      @media (pointer: fine) {
        a, button, [role='button'], .lp-cursor-expand, body {
          cursor: none !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      cancelAnimationFrame(rafRef.current);
      document.getElementById("custom-cursor-hide-native")?.remove();
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <div
      ref={cursorRef}
      className="lp-custom-cursor"
      aria-hidden="true"
    />
  );
}
