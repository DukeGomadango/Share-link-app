import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { generateIntegrationTokenPlain, hashIntegrationToken } from "@/lib/integration-token";
import { getDb } from "@/db";
import { integrationAccessTokens } from "@/db/schema";

export async function GET() {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select({
      id: integrationAccessTokens.id,
      label: integrationAccessTokens.label,
      scopes: integrationAccessTokens.scopes,
      createdAt: integrationAccessTokens.createdAt,
    })
    .from(integrationAccessTokens)
    .where(eq(integrationAccessTokens.workspaceId, ctx.workspaceId))
    .orderBy(desc(integrationAccessTokens.createdAt));

  return NextResponse.json({
    tokens: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { label?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const plain = generateIntegrationTokenPlain();
  const tokenHash = hashIntegrationToken(plain);
  const label = body.label?.trim() || "だんごツール連携";

  const db = getDb();
  const [row] = await db
    .insert(integrationAccessTokens)
    .values({
      workspaceId: ctx.workspaceId,
      label,
      tokenHash,
      scopes: "campaigns:read,claims:issue",
    })
    .returning({
      id: integrationAccessTokens.id,
      label: integrationAccessTokens.label,
      scopes: integrationAccessTokens.scopes,
      createdAt: integrationAccessTokens.createdAt,
    });

  return NextResponse.json({
    id: row.id,
    token: plain,
    label: row.label,
    scopes: row.scopes,
    createdAt: row.createdAt.toISOString(),
  });
}
