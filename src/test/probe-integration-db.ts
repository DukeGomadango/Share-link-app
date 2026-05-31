import { sql } from "drizzle-orm";

import { getDb } from "@/db";

/** Returns true when DATABASE_URL is set and Postgres accepts a connection. */
export async function probeIntegrationDb(): Promise<boolean> {
  if (!process.env.DATABASE_URL?.trim()) return false;
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
