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
      isExternalLinked: campaigns.isExternalLinked,
    })
    .from(campaigns)
    .where(eq(campaigns.workspaceId, auth.workspaceId))
    .orderBy(desc(campaigns.createdAt));

  return jsonWithCors(rows, request);
}

export async function POST(request: Request) {
  const auth = await resolveIntegrationBearer(request, "campaigns:write");
  if (auth instanceof Response) {
    return auth;
  }

  const body = await request.json().catch(() => ({}));
  const { name, description } = body;

  if (!name) {
    return jsonWithCors(
      { error: "invalid_input", message: "キャンペーン名（name）は必須です" },
      request,
      { status: 400 }
    );
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const publicReceptionToken = crypto.randomUUID().replace(/-/g, "");

  try {
    await db.insert(campaigns).values({
      id,
      workspaceId: auth.workspaceId,
      name,
      description: description || null,
      status: "active",
      securityLevel: "high",
      distributionMode: "per_link",
      isExternalLinked: true,
      publicReceptionToken,
    });

    return jsonWithCors({ id, name }, request);
  } catch (err) {
    console.error("Failed to create campaign via external API:", err);
    return jsonWithCors(
      {
        error: "internal_error",
        message: err instanceof Error ? err.message : "不明なエラーが発生しました",
      },
      request,
      { status: 500 }
    );
  }
}
