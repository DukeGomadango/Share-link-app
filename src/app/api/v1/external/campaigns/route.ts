import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { campaigns } from "@/db/schema";
import { resolveIntegrationBearer } from "@/lib/external-auth";
import { handleCorsPreflight, jsonWithCors } from "@/lib/external-cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  const auth = await resolveIntegrationBearer(request, "campaigns:read");
  if (auth instanceof Response) {
    return auth;
  }

  const db = getDb();
  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      status: campaigns.status,
    })
    .from(campaigns)
    .where(eq(campaigns.workspaceId, auth.workspaceId))
    .orderBy(desc(campaigns.createdAt));

  return jsonWithCors(rows, request);
}
