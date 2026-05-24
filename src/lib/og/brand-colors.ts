/** OGP 等で LP の primary / 背景トーンに合わせた固定色（ImageResponse 用） */
export const OG_COLORS = {
  primary: "#10b981",
  primaryDark: "#059669",
  primarySoft: "rgba(16, 185, 129, 0.12)",
  primaryBorder: "rgba(16, 185, 129, 0.28)",
  primaryMuted: "rgba(16, 185, 129, 0.06)",
  background: "#ffffff",
  backgroundTint: "#f4faf7",
  backgroundMuted: "#f4f4f5",
  urlBackground: "#f8faf9",
  foreground: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  borderSubtle: "#ececef",
  glass: "rgba(255, 255, 255, 0.94)",
  patternStroke: "rgba(5, 150, 105, 0.08)",
  /** 右下ヒーローチェーン（原寸で視認できる濃さ） */
  patternStrokeHero: "rgba(5, 150, 105, 0.13)",
  /** 対角流線 */
  patternStrokeLight: "rgba(5, 150, 105, 0.065)",
  orb: "rgba(16, 185, 129, 0.14)",
  orbSecondary: "rgba(16, 185, 129, 0.11)",
  ghostFill: "rgba(255, 255, 255, 0.42)",
  ghostBorder: "rgba(16, 185, 129, 0.18)",
  connector: "rgba(5, 150, 105, 0.35)",
  diagonalTint: "rgba(240, 253, 249, 0.85)",
} as const;
