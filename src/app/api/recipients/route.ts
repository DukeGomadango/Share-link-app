import { NextResponse } from "next/server";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { fetchRecipients } from "@/lib/recipients-query";
import { getDb } from "@/db";
import { recipients } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await fetchRecipients(ctx.workspaceId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    tags?: string[];
    platformId?: any;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim() || "新規受取人";

  const db = getDb();
  const [row] = await db
    .insert(recipients)
    .values({
      workspaceId: ctx.workspaceId,
      name,
      tags: body.tags ?? [],
      platformId: body.platformId,
    })
    .returning();

  const list = await fetchRecipients(ctx.workspaceId);
  const created = list.find((r) => r.id === row.id);
  
  return NextResponse.json(created, { status: 201 });
}
