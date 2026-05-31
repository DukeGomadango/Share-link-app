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

const sql = postgres(withDefaults(raw), { prepare: false, max: 1 });

try {
  const migrations = await sql.unsafe(
    "select id, hash, created_at from drizzle.__drizzle_migrations order by created_at desc limit 10"
  );
  const triggers = await sql.unsafe(
    "select tgname from pg_trigger where tgname='enforce_campaign_asset_workspace_match'"
  );
  const rls = await sql.unsafe(
    "select relname, relrowsecurity from pg_class where relname in ('workspaces','workspace_users','campaigns','assets','claims') order by relname"
  );
  const policies = await sql.unsafe(
    "select tablename, policyname from pg_policies where tablename in ('workspaces','workspace_users','campaigns','assets','claims') order by tablename, policyname"
  );
  const roles = await sql.unsafe(
    "select rolname from pg_roles where rolname in ('anon','authenticated') order by rolname"
  );

  console.log(JSON.stringify({
    latestMigrations: migrations,
    hasWorkspaceTrigger: triggers.length > 0,
    rls,
    policyCount: policies.length,
    roles,
  }, null, 2));
} catch (error) {
  console.error("security-state check failed:", error?.message ?? error);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
