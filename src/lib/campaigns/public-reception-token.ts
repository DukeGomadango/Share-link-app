import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { campaigns } from "@/db/schema";

/** 未設定なら生成して保存（並列時は他プロセスが埋めたトークンを再読込） */
export async function ensurePublicReceptionToken(campaignId: string): Promise<string> {
  const db = getDb();
  const row = await db
    .select({ token: campaigns.publicReceptionToken })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);
  if (row[0]?.token) {
    return row[0].token;
  }

  for (let i = 0; i < 5; i++) {
    const token = randomBytes(24).toString("base64url");
    const updated = await db
      .update(campaigns)
      .set({ publicReceptionToken: token })
      .where(and(eq(campaigns.id, campaignId), isNull(campaigns.publicReceptionToken)))
      .returning({ token: campaigns.publicReceptionToken });
    if (updated[0]?.token) {
      return updated[0].token;
    }
    const again = await db
      .select({ token: campaigns.publicReceptionToken })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);
    if (again[0]?.token) {
      return again[0].token;
    }
  }

  throw new Error("Failed to allocate public reception token");
}
