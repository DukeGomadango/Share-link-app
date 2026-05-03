import { NextResponse } from "next/server";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { recipients } from "@/db/schema";

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    recipients: {
      name: string;
      tags?: string[];
      platformId?: { type: string; handle: string };
    }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
    return NextResponse.json({ error: "受取人リストが必要です" }, { status: 400 });
  }

  const db = getDb();
  
  // Split into chunks to avoid potential DB limits
  const CHUNK_SIZE = 100;
  for (let i = 0; i < body.recipients.length; i += CHUNK_SIZE) {
    const chunk = body.recipients.slice(i, i + CHUNK_SIZE);
    await db.insert(recipients).values(
      chunk.map((r) => ({
        workspaceId: ctx.workspaceId,
        name: r.name || "新規受取人",
        tags: r.tags ?? [],
        platformId: r.platformId as any,
      }))
    );
  }

  return NextResponse.json({ success: true, count: body.recipients.length });
}
