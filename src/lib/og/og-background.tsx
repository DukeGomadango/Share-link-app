import { OG_COLORS as c } from "@/lib/og/brand-colors";
import { OG_SIZE } from "@/lib/og/og-layout";

/** キャンバス全面：対角グラデ + 右下ヒーローチェーン + 流線 1 本 + オーブ 2 つ */
export function OgCanvasBackground() {
  const { width, height } = OG_SIZE;
  const hero = c.patternStrokeHero;
  const light = c.patternStrokeLight;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(128deg, ${c.background} 0%, ${c.diagonalTint} 38%, ${c.backgroundTint} 62%, ${c.background} 100%)`,
        }}
      />

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* 右下：主モチーフ（大きなリンクチェーン） */}
        <path
          d="M820 520c0-16 13-28 28-28h32c15 0 28 12 28 28v6H848v-6z"
          stroke={hero}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M908 488l52-52" stroke={hero} strokeWidth="3" strokeLinecap="round" />
        <path
          d="M960 436c0-14 11-25 25-25h28c14 0 25 11 25 25v5H985v-5z"
          stroke={hero}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M1032 404l40-40" stroke={hero} strokeWidth="3" strokeLinecap="round" />
        <circle cx="848" cy="526" r="10" stroke={hero} strokeWidth="2.5" fill="none" />
        <circle cx="960" cy="436" r="9" stroke={hero} strokeWidth="2.5" fill="none" />
        <circle cx="1072" cy="364" r="8" stroke={hero} strokeWidth="2.5" fill="none" />

        <path d="M0 200 Q520 340 1200 500" stroke={light} strokeWidth="1.8" strokeLinecap="round" />
      </svg>

      <div
        style={{
          position: "absolute",
          top: 100,
          left: 40,
          width: 400,
          height: 400,
          borderRadius: 999,
          background: `radial-gradient(circle, ${c.orb} 0%, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 120,
          right: 24,
          width: 480,
          height: 480,
          borderRadius: 999,
          background: `radial-gradient(circle, ${c.orbSecondary} 0%, transparent 72%)`,
        }}
      />
    </div>
  );
}
