import { NextResponse } from "next/server";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { recipients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { fetchRecipients } from "@/lib/recipients-query";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: {
    name?: string;
    tags?: string[];
    platformId?: any;
    listenerNote?: string;
    streamerMemo?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = getDb();
  await db
    .update(recipients)
    .set({
      name: body.name,
      tags: body.tags,
      platformId: body.platformId,
      listenerNote: body.listenerNote,
      streamerMemo: body.streamerMemo,
      updatedAt: new Date(),
    })
    .where(and(eq(recipients.id, id), eq(recipients.workspaceId, ctx.workspaceId)));

  const list = await fetchRecipients(ctx.workspaceId);
  return NextResponse.json(list);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  await db
    .delete(recipients)
    .where(and(eq(recipients.id, id), eq(recipients.workspaceId, ctx.workspaceId)));

  const list = await fetchRecipients(ctx.workspaceId);
  return NextResponse.json(list);
}
