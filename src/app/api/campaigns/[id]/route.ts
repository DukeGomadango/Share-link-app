import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { fetchCampaignWithStats } from "@/lib/campaigns-query";
import { dbStatusFromUi } from "@/lib/campaign-status";
import { getDb } from "@/db";
import { campaigns } from "@/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const row = await fetchCampaignWithStats(ctx.workspaceId, id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.status;
  if (raw !== "draft" && raw !== "active" && raw !== "completed") {
    return NextResponse.json({ error: "status が不正です" }, { status: 400 });
  }

  const db = getDb();
  const updated = await db
    .update(campaigns)
    .set({ status: dbStatusFromUi(raw) })
    .where(
      and(eq(campaigns.workspaceId, ctx.workspaceId), eq(campaigns.id, id))
    )
    .returning({ id: campaigns.id });

  if (!updated[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await fetchCampaignWithStats(ctx.workspaceId, id);
  return NextResponse.json(row);
}
