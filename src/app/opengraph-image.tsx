import { ImageResponse } from "next/og";
import { SITE_CONFIG } from "@/lib/site";

export const runtime = "edge";
export const alt = SITE_CONFIG.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #022c22 0%, #064e3b 45%, #0f172a 100%)",
          color: "#ecfdf5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(16, 185, 129, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            🍡
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, opacity: 0.9 }}>{SITE_CONFIG.name}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: 900,
          }}
        >
          <span>配信者向け</span>
          <span>ファイル配布プラットフォーム</span>
        </div>
        <p style={{ marginTop: 28, fontSize: 26, lineHeight: 1.5, opacity: 0.85, maxWidth: 820 }}>
          キャンペーン単位の特典配布 · 受取人ごとの限定リンク · だんごツール連携
        </p>
      </div>
    ),
    { ...size }
  );
}
