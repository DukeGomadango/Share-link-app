import postgres from "postgres";
import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { parse } from "dotenv";

async function main() {
  let url = process.env.DATABASE_URL;
  if (!url && existsSync(".env.local")) {
    const envConfig = parse(readFileSync(".env.local"));
    url = envConfig.DATABASE_URL;
  }
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url);

  console.log("Dropping column use_otp...");
  await sql`ALTER TABLE campaigns DROP COLUMN use_otp`;
  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
