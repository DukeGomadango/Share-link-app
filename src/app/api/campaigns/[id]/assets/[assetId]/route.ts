import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { campaignAssets } from "@/db/schema";

type RouteParams = { params: Promise<{ id: string; assetId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId, assetId } = await params;

  let body: {
    gachaRarityId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = getDb();

  const updated = await db
    .update(campaignAssets)
    .set({ gachaRarityId: body.gachaRarityId })
    .where(
      and(
        eq(campaignAssets.campaignId, campaignId),
        eq(campaignAssets.id, assetId)
      )
    )
    .returning({ id: campaignAssets.id });

  if (!updated[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
