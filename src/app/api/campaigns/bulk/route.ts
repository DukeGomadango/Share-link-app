import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { fetchCampaignsWithStats } from "@/lib/campaigns-query";
import { dbStatusFromUi } from "@/lib/campaign-status";
import { getDb } from "@/db";
import { campaigns } from "@/db/schema";

export async function PATCH(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: string[]; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = body.ids?.filter(Boolean) ?? [];
  const raw = body.status;
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids が必要です" }, { status: 400 });
  }
  if (raw !== "draft" && raw !== "active" && raw !== "completed") {
    return NextResponse.json({ error: "status が不正です" }, { status: 400 });
  }

  const db = getDb();
  await db
    .update(campaigns)
    .set({ status: dbStatusFromUi(raw) })
    .where(
      and(eq(campaigns.workspaceId, ctx.workspaceId), inArray(campaigns.id, ids))
    );

  const list = await fetchCampaignsWithStats(ctx.workspaceId);
  return NextResponse.json({ ok: true, campaigns: list });
}

export async function DELETE(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = body.ids?.filter(Boolean) ?? [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids が必要です" }, { status: 400 });
  }

  const db = getDb();
  await db
    .delete(campaigns)
    .where(
      and(eq(campaigns.workspaceId, ctx.workspaceId), inArray(campaigns.id, ids))
    );

  const list = await fetchCampaignsWithStats(ctx.workspaceId);
  return NextResponse.json({ ok: true, campaigns: list });
}
