import { OG_COLORS as c } from "@/lib/og/brand-colors";
import { OG_LAYOUT } from "@/lib/og/og-layout";

/** 左コピー → 右カードの視線誘導（控えめな矢印） */
export function OgColumnConnector() {
  const { width } = OG_LAYOUT.connector;

  return (
    <div
      style={{
        width,
        display: "flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
      }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="13" fill={c.primarySoft} stroke={c.connector} strokeWidth="1" />
        <path
          d="M10 14h8M15 11l4 3-4 3"
          stroke={c.primaryDark}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
