/**
 * 本番向けセキュリティ HTTP ヘッダ（フェーズ 1-A）。
 * `next.config.ts` の `headers()` から利用。
 */

function supabaseConnectHosts(): string[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) {
    return ["https://*.supabase.co", "wss://*.supabase.co"];
  }
  try {
    const url = new URL(raw);
    const host = url.host;
    if (url.protocol === "http:") {
      return [`http://${host}`, `ws://${host}`];
    }
    return [`https://${host}`, `wss://${host}`];
  } catch {
    return ["https://*.supabase.co", "wss://*.supabase.co"];
  }
}

export function buildContentSecurityPolicy(): string {
  const supabase = supabaseConnectHosts();
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(process.env.NODE_ENV === "production" ? [] : ["'unsafe-eval'"]),
    "https://js.stripe.com",
    "http://localhost:3000",
    "https://dango-portal.vercel.app",
  ].join(" ");
  const connectSrc = [
    "'self'",
    ...supabase,
    "https://api.stripe.com",
    "https://checkout.stripe.com",
    "https://*.r2.cloudflarestorage.com",
    "https://accounts.google.com",
    "https://discord.com",
    "https://discordapp.com",
  ].join(" ");

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    // Next.js App Router は inline script が必要なため、eval のみ本番で外す。
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://accounts.google.com https://discord.com",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
  ];

  return directives.join("; ");
}

export function buildSecurityHeaders(): { key: string; value: string }[] {
  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(self)",
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  ];
}
