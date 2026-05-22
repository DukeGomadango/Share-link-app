import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { recipients } from "@/db/schema";
import { resolveIntegrationBearer } from "@/lib/external-auth";
import { handleCorsPreflight, jsonWithCors } from "@/lib/external-cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

/**
 * ワークスペースの受取人名簿（最小フィールド）を返す。
 * だんごツール等がプレイヤーと名簿行を紐づけるときに利用。
 */
export async function GET(request: Request) {
  const auth = await resolveIntegrationBearer(request, "campaigns:read");
  if (auth instanceof Response) return auth;

  const db = getDb();
  const rows = await db
    .select({
      id: recipients.id,
      name: recipients.name,
    })
    .from(recipients)
    .where(eq(recipients.workspaceId, auth.workspaceId))
    .orderBy(recipients.name);

  return jsonWithCors({ ok: true, recipients: rows }, request);
}
