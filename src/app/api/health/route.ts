import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { isR2Configured, isStorageConfigured } from "@/lib/storage/config";

/**
 * 本番デプロイ後の設定確認用（秘密値は返さない）。
 * GET /api/health
 */
export async function GET() {
  const checks = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL?.trim()),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
    ),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
    storage: isStorageConfigured(),
    r2: isR2Configured(),
  };

  let database: { ok: boolean; error?: string } = { ok: false };
  if (checks.DATABASE_URL) {
    try {
      const db = getDb();
      await db.execute(sql`select 1`);
      database = { ok: true };
    } catch (e) {
      database = {
        ok: false,
        error: e instanceof Error ? e.message : "database connection failed",
      };
    }
  } else {
    database = { ok: false, error: "DATABASE_URL is not set" };
  }

  const envOk = Object.entries(checks)
    .filter(([k]) => k !== "storage" && k !== "r2")
    .every(([, v]) => v === true);

  const ok = envOk && database.ok && checks.storage;

  return NextResponse.json(
    {
      ok,
      checks,
      database,
      hint: !checks.DATABASE_URL
        ? "Vercel に DATABASE_URL（Supabase Transaction Pooler・ポート 6543）を設定して Redeploy"
        : !database.ok
          ? "DATABASE_URL を確認（Pooler URL・sslmode=require・本番 DB に migrate 済みか）"
          : !checks.storage
            ? "R2_* または SUPABASE_SERVICE_ROLE_KEY を設定"
            : undefined,
    },
    { status: ok ? 200 : 503 }
  );
}
