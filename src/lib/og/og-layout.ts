/** OGP 画像（1200×630）のレイアウト定数（LP mock も参照） */
export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG_LAYOUT = {
  frame: {
    paddingX: 64,
  },
  left: {
    width: 500,
  },
  connector: {
    width: 36,
  },
  brand: {
    iconSize: 40,
    nameSize: 20,
    rowGap: 12,
    marginBottom: 22,
  },
  headline: {
    size: 62,
    line1LineHeight: 1.12,
    line2LineHeight: 1.18,
    letterSpacing: "-0.025em",
  },
  mock: {
    width: 500,
    padding: 30,
    borderRadius: 20,
    recipientSize: 36,
    urlSize: 13,
    chipSize: 14,
    statusSize: 12,
  },
  ghost: {
    offsetX: 34,
    offsetY: 38,
    borderRadius: 20,
    height: 318,
  },
} as const;
