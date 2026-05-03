import { NextResponse } from "next/server";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { computeWorkspaceOverviewStats } from "@/lib/stats/workspace-overview";

export async function GET() {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await computeWorkspaceOverviewStats(ctx.workspaceId);
  return NextResponse.json(stats);
}
