import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { integrationAccessTokens } from "@/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const deleted = await db
    .delete(integrationAccessTokens)
    .where(
      and(
        eq(integrationAccessTokens.id, id),
        eq(integrationAccessTokens.workspaceId, ctx.workspaceId)
      )
    )
    .returning({ id: integrationAccessTokens.id });

  if (!deleted[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
