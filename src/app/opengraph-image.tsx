import { ImageResponse } from "next/og";
import { LINK_CARD_PREVIEW } from "@/lib/marketing/link-card-preview";
import { OG_COLORS as c } from "@/lib/og/brand-colors";
import { OgCanvasBackground } from "@/lib/og/og-background";
import { OgColumnConnector } from "@/lib/og/og-connector";
import { loadNotoSansJP } from "@/lib/og/load-noto-sans-jp";
import { OG_LAYOUT, OG_SIZE } from "@/lib/og/og-layout";
import { OgProductMock } from "@/lib/og/og-product-mock";
import { SITE_CONFIG } from "@/lib/site";

export const runtime = "edge";
export const alt = SITE_CONFIG.name;
export const size = OG_SIZE;
export const contentType = "image/png";

const { tagline } = SITE_CONFIG;

const FONT_TEXT =
  SITE_CONFIG.name +
  tagline.line1 +
  tagline.line2Highlight +
  tagline.line2After +
  LINK_CARD_PREVIEW.recipientName +
  LINK_CARD_PREVIEW.fileName +
  LINK_CARD_PREVIEW.claimUrl +
  LINK_CARD_PREVIEW.statusLabel;

function OgBrandIcon() {
  const iconSize = OG_LAYOUT.brand.iconSize;
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 64 64">
      <rect x="4" y="4" width="56" height="56" rx="16" fill={c.primary} />
      <rect x="4.5" y="4.5" width="55" height="55" rx="15.5" fill="none" stroke="rgba(255,255,255,0.32)" />
      <path
        d="M18 19c0-2.2 1.8-4 4-4h22c2.2 0 4 1.8 4 4v7c-11-1.8-20.6 1.1-30 8z"
        fill="rgba(255,255,255,0.86)"
      />
      <path
        d="M17 42.5c7-9.4 16.2-14 27.8-12.8M36.8 26.8l8.2 2.3-3.7 7.6M17 42.5l11.4 0.6"
        fill="none"
        stroke="rgba(255,255,255,0.86)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function OpenGraphImage() {
  const [fontRegular, fontBold, fontExtraBold] = await Promise.all([
    loadNotoSansJP(400, FONT_TEXT),
    loadNotoSansJP(700, FONT_TEXT),
    loadNotoSansJP(800, FONT_TEXT),
  ]);

  const fontFamily = "Noto Sans JP";
  const { frame, left, brand, headline } = OG_LAYOUT;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: c.background,
          color: c.foreground,
          fontFamily,
        }}
      >
        <OgCanvasBackground />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            paddingLeft: frame.paddingX,
            paddingRight: frame.paddingX,
          }}
        >
          <div
            style={{
              width: left.width,
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: brand.rowGap,
                marginBottom: brand.marginBottom,
              }}
            >
              <OgBrandIcon />
              <span style={{ fontSize: brand.nameSize, fontWeight: 700, color: c.foreground }}>
                {SITE_CONFIG.name}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: headline.size,
                fontWeight: 800,
                letterSpacing: headline.letterSpacing,
              }}
            >
              <span style={{ lineHeight: headline.line1LineHeight }}>{tagline.line1}</span>
              <div style={{ display: "flex", lineHeight: headline.line2LineHeight }}>
                <span style={{ color: c.primaryDark }}>{tagline.line2Highlight}</span>
                <span>{tagline.line2After}</span>
              </div>
            </div>
          </div>

          <OgColumnConnector />

          <div style={{ display: "flex", flexShrink: 0, alignItems: "center" }}>
            <OgProductMock />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: fontFamily, data: fontRegular, weight: 400, style: "normal" },
        { name: fontFamily, data: fontBold, weight: 700, style: "normal" },
        { name: fontFamily, data: fontExtraBold, weight: 800, style: "normal" },
      ],
    },
  );
}
