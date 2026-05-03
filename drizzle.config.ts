import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle CLI は `.env.local` を読まないので、ここで Next と同順に読み込む。
 * `.env.local` があれば末尾で上書き。
 */
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

/**
 * Drizzle がマイグレーション／push を適用するときは **ダイレクト接続**（例: Supabase の 5432）を推奨。
 * アプリランタイム（Vercel 等）は `DATABASE_URL` に **プーラー経由（Supavisor / 6543 等）**。
 */
/** Supabase などでは sslmode 無しだと接続が長時間固まることがある */
function ensurePgParams(url: string): string {
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

function databaseUrl(): string {
  const url =
    process.env.DATABASE_URL_DIRECT?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "";
  if (!url) {
    throw new Error(
      "drizzle-kit: DATABASE_URL_DIRECT または DATABASE_URL が空です。.env.local に設定してください。"
    );
  }
  return ensurePgParams(url);
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl(),
  },
});
