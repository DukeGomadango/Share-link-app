import { OG_COLORS as c } from "@/lib/og/brand-colors";

const STROKE = {
  width: 2,
  linecap: "round" as const,
  linejoin: "round" as const,
  color: c.primaryDark,
};

type IconProps = { size?: number };

export function OgMusicIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18V6l12-2v12"
        stroke={STROKE.color}
        strokeWidth={STROKE.width}
        strokeLinecap={STROKE.linecap}
        strokeLinejoin={STROKE.linejoin}
      />
      <circle cx="6" cy="18" r="3" stroke={STROKE.color} strokeWidth={STROKE.width} fill="none" />
      <circle cx="18" cy="16" r="3" stroke={STROKE.color} strokeWidth={STROKE.width} fill="none" />
    </svg>
  );
}

export function OgLinkIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke={STROKE.color}
        strokeWidth={STROKE.width}
        strokeLinecap={STROKE.linecap}
        strokeLinejoin={STROKE.linejoin}
      />
      <path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke={STROKE.color}
        strokeWidth={STROKE.width}
        strokeLinecap={STROKE.linecap}
        strokeLinejoin={STROKE.linejoin}
      />
    </svg>
  );
}

export function OgCheckIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={STROKE.color} strokeWidth={STROKE.width} fill={c.primarySoft} />
      <path
        d="M8 12.5l2.5 2.5 5.5-5.5"
        stroke={STROKE.color}
        strokeWidth={STROKE.width}
        strokeLinecap={STROKE.linecap}
        strokeLinejoin={STROKE.linejoin}
      />
    </svg>
  );
}
