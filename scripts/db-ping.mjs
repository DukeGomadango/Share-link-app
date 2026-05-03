/**
 * DB への TCP + SSL が届くかを数秒で確認する（drizzle-kit が長時間止まるときの切り分け用）。
 * 使い方: npm run db:ping
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import postgres from "postgres";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const raw =
  process.env.DATABASE_URL_DIRECT?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "";

if (!raw) {
  console.error("DATABASE_URL_DIRECT または DATABASE_URL が .env.local にありません。");
  process.exit(1);
}

/** 長時間ハングしがちなときは URI に connect_timeout / sslmode を付ける（Supabase は sslmode=require が無いと詰まることがある） */
function withDefaults(url) {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("sslmode")) {
      u.searchParams.set("sslmode", "require");
    }
    if (!u.searchParams.has("connect_timeout")) {
      u.searchParams.set("connect_timeout", "15");
    }
    return u.toString();
  } catch {
    return url;
  }
}

const url = withDefaults(raw);
console.log("接続テスト中…（最大約15秒でタイムアウト）");

const sql = postgres(url, { prepare: false, max: 1 });

try {
  const rows = await sql`SELECT 1 AS ok`;
  console.log("OK:", rows);
} catch (e) {
  console.error("接続失敗:", e.message || e);
  console.error("\n確認: Supabase ダッシュボードでプロジェクトが停止していないか、URI が Direct(5432) か、ファイアウォール/VPN。");
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
