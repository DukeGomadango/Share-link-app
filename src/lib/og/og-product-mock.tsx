import { LINK_CARD_PREVIEW } from "@/lib/marketing/link-card-preview";
import { OG_COLORS as c } from "@/lib/og/brand-colors";
import { OgCheckIcon, OgLinkIcon, OgMusicIcon } from "@/lib/og/og-icons";
import { OG_LAYOUT } from "@/lib/og/og-layout";

const { mock: m, ghost: g } = OG_LAYOUT;

/** LP と同系統のリンクカード mock（OG 右カラム・1 枚構成） */
export function OgProductMock() {
  const { recipientName, fileName, fileDuration, claimUrl, statusLabel } = LINK_CARD_PREVIEW;

  return (
    <div
      style={{
        position: "relative",
        width: m.width + g.offsetX,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: g.offsetY,
          right: 0,
          width: m.width,
          height: g.height,
          borderRadius: g.borderRadius,
          border: `1px solid ${c.ghostBorder}`,
          background: c.ghostFill,
          boxShadow: "0 20px 48px rgba(16, 185, 129, 0.08)",
        }}
      />

      <div
        style={{
          position: "relative",
          width: m.width,
          display: "flex",
          flexDirection: "column",
          borderRadius: m.borderRadius,
          border: `1px solid ${c.border}`,
          background: c.glass,
          boxShadow:
            "0 36px 80px rgba(16, 185, 129, 0.15), 0 14px 36px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03)",
          padding: m.padding,
        }}
      >
        <div style={{ display: "flex", marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 999,
              border: `1px solid ${c.primaryBorder}`,
              background: c.primarySoft,
              padding: "8px 14px",
            }}
          >
            <OgMusicIcon size={16} />
            <span style={{ fontSize: m.chipSize, fontWeight: 600, color: c.foreground }}>{fileName}</span>
            <span style={{ fontSize: m.chipSize - 1, color: c.muted }}>{fileDuration}</span>
          </div>
        </div>

        <span
          style={{
            fontSize: m.recipientSize,
            fontWeight: 800,
            color: c.foreground,
            letterSpacing: "-0.03em",
            lineHeight: 1.12,
          }}
        >
          {recipientName}
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 16,
            borderRadius: 10,
            border: `1px solid ${c.borderSubtle}`,
            background: c.urlBackground,
            padding: "8px 12px",
          }}
        >
          <OgLinkIcon size={15} />
          <span
            style={{
              fontSize: m.urlSize,
              fontWeight: 500,
              color: c.muted,
              fontFamily: "ui-monospace, monospace",
            }}
          >
            {claimUrl}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 18,
            alignSelf: "flex-start",
            borderRadius: 999,
            background: c.primarySoft,
            padding: "7px 12px",
          }}
        >
          <OgCheckIcon size={13} />
          <span style={{ fontSize: m.statusSize, fontWeight: 700, color: c.primaryDark }}>{statusLabel}</span>
        </div>
      </div>
    </div>
  );
}
