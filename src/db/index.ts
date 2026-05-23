import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { normalizeDatabaseUrl } from "@/lib/db-connection-url";

type Db = PostgresJsDatabase<typeof schema>;

const globalForPg = globalThis as unknown as {
  __postgresClient?: postgres.Sql;
  __drizzleDb?: Db;
};

/** 同一開発プロセスでの二重 postgres インスタンスを避ける（HMR 対策） */
function getPgClient(): postgres.Sql {
  if (globalForPg.__postgresClient) {
    return globalForPg.__postgresClient;
  }
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "DATABASE_URL が未設定です。Supabase の接続プール用 URL を .env に設定してください。"
    );
  }
  const url = normalizeDatabaseUrl(raw);
  const client = postgres(url, {
    prepare: false,
    max: Number(process.env.DATABASE_POOL_MAX ?? "10"),
  });
  globalForPg.__postgresClient = client;
  return client;
}

/** Route Handler／Server で利用。**初回実行時のみ**クラウド DB に繋ぐ。 */
export function getDb(): Db {
  if (!globalForPg.__drizzleDb) {
    globalForPg.__drizzleDb = drizzle(getPgClient(), { schema });
  }
  return globalForPg.__drizzleDb;
}
