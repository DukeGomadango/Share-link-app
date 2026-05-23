/**
 * assets テーブルの bucket 別件数・容量（Storage 移行の棚卸し用・読み取りのみ）。
 * 使い方: npm run storage:inventory
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
  console.error("DATABASE_URL_DIRECT または DATABASE_URL が必要です。");
  process.exit(1);
}

function withDefaults(url) {
  try {
    const u = new URL(url);
    if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
    if (!u.searchParams.has("connect_timeout")) u.searchParams.set("connect_timeout", "15");
    return u.toString();
  } catch {
    return url;
  }
}

const sql = postgres(withDefaults(raw), { prepare: false, max: 1 });

function formatBytes(n) {
  if (n >= 1_073_741_824) return `${(n / 1_073_741_824).toFixed(2)} GiB`;
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(2)} MiB`;
  if (n >= 1024) return `${(n / 1024).toFixed(2)} KiB`;
  return `${n} B`;
}

try {
  const byBucket = await sql`
    SELECT
      bucket,
      COUNT(*)::int AS asset_count,
      COALESCE(SUM(size_bytes), 0)::bigint AS total_bytes
    FROM assets
    GROUP BY bucket
    ORDER BY bucket
  `;

  const totals = await sql`
    SELECT
      COUNT(*)::int AS asset_count,
      COALESCE(SUM(size_bytes), 0)::bigint AS total_bytes
    FROM assets
  `;

  const r2Name = process.env.R2_BUCKET_NAME?.trim() || null;

  console.log("\n=== Storage inventory (assets) ===\n");
  console.log("bucket".padEnd(28), "count".padStart(8), "size".padStart(12));
  console.log("-".repeat(52));
  for (const row of byBucket) {
    const label =
      r2Name && row.bucket === r2Name
        ? `${row.bucket} (R2)`
        : row.bucket === "assets"
          ? `${row.bucket} (Supabase legacy?)`
          : row.bucket;
    console.log(
      label.padEnd(28),
      String(row.asset_count).padStart(8),
      formatBytes(Number(row.total_bytes)).padStart(12)
    );
  }
  const t = totals[0];
  console.log("-".repeat(52));
  console.log(
    "TOTAL".padEnd(28),
    String(t?.asset_count ?? 0).padStart(8),
    formatBytes(Number(t?.total_bytes ?? 0)).padStart(12)
  );
  if (r2Name) {
    const legacy = byBucket.filter((r) => r.bucket !== r2Name);
    if (legacy.length > 0) {
      console.log(
        `\n注意: R2_BUCKET_NAME=${r2Name} 以外の bucket に ${legacy.reduce((s, r) => s + r.asset_count, 0)} 件あり。移行または削除の対象です。`
      );
    } else {
      console.log(`\nOK: 全件が R2 bucket (${r2Name}) に統一されています。`);
    }
  }
  console.log("\n(JSON)", JSON.stringify({ byBucket, totals: t, r2BucketName: r2Name }, null, 0));
} catch (e) {
  console.error("クエリ失敗:", e.message || e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
