/**
 * Supabase 等への接続で sslmode 無しだと Vercel 等から接続が失敗・ハングすることがある。
 * drizzle.config と同様のクエリをランタイム URL にも付与する。
 */
export function normalizeDatabaseUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("sslmode")) {
      u.searchParams.set("sslmode", "require");
    }
    if (!u.searchParams.has("connect_timeout")) {
      u.searchParams.set("connect_timeout", "30");
    }
    return u.toString();
  } catch {
    return url;
  }
}
