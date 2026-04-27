"use client";

import { useEffect, useRef, CSSProperties } from "react";
import { Lock } from "lucide-react";

export function ImageViewer({ src, watermarkText }: { src: string; watermarkText: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = src;

    img.onload = () => {
      // スマホ画面の幅に合わせて適切にリサイズ
      const targetWidth = Math.min(img.width, window.innerWidth - 48); // 余白考慮
      const targetHeight = (img.height / img.width) * targetWidth;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // 1. 元の画像を描画
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // 2. 透かしの描画設定
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 画像全体を斜めに回転してパターンで描画
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((-30 * Math.PI) / 180);
      
      const spacing = 150;
      for (let i = -targetWidth; i < targetWidth; i += spacing) {
        for (let j = -targetHeight; j < targetHeight; j += spacing) {
          ctx.fillText(watermarkText, i, j);
        }
      }
    };
  }, [src, watermarkText]);

  return (
    <div 
      className="relative rounded-3xl overflow-hidden glass p-1.5 flex justify-center items-center select-none shadow-2xl ring-1 ring-white/10" 
      onContextMenu={(e) => e.preventDefault()} // 右クリック（長押し）コンテキストメニュー防止
    >
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-1.5 text-xs font-semibold text-white/90 z-10 pointer-events-none">
        <Lock className="w-3.5 h-3.5" />
        <span>Protected</span>
      </div>
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto rounded-2xl pointer-events-none" 
        style={{ WebkitTouchCallout: "none" } as CSSProperties} // iOS長押しポップアップ防止
      />
    </div>
  );
}
