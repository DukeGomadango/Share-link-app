import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { assets } from "@/db/schema";
import { getSessionWorkspaceContext } from "@/lib/auth/session";

export async function PATCH(
  request: Request,
  { params }: { params: { fileId: string } }
) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const db = getDb();
  const result = await db
    .update(assets)
    .set({ originalFilename: name })
    .where(
      and(
        eq(assets.id, params.fileId),
        eq(assets.workspaceId, ctx.workspaceId)
      )
    )
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}
