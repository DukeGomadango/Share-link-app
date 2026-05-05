import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { fetchCampaignsWithStats } from "@/lib/campaigns-query";
import { getDb } from "@/db";
import { campaigns, campaignAssets, workspaces } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await fetchCampaignsWithStats(ctx.workspaceId);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    description?: string;
    tags?: string[];
    expiresAt?: string;
    securityLevel?: string;
    assetIds?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name が必要です" }, { status: 400 });
  }

  const isPublic = (body.securityLevel ?? "standard") === "standard";
  const publicReceptionToken = isPublic ? randomBytes(12).toString("hex") : null;

  const db = getDb();

  const [row] = await db
    .insert(campaigns)
    .values({
      workspaceId: ctx.workspaceId,
      name,
      description: body.description?.trim(),
      tags: body.tags ?? [],
      status: "draft",
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      securityLevel: body.securityLevel ?? "standard",
      distributionMode: isPublic ? "reception" : "per_link",
      publicReceptionToken,
    })
    .returning();

  if (body.assetIds && body.assetIds.length > 0) {
    await db.insert(campaignAssets).values(
      body.assetIds.map((assetId) => ({
        campaignId: row.id,
        assetId,
      }))
    ).onConflictDoNothing();
  }

  const list = await fetchCampaignsWithStats(ctx.workspaceId);
  const created = list.find((c) => c.id === row.id);
  return NextResponse.json(
    created ?? {
      id: row.id,
      name: row.name,
      status: "draft" as const,
      type: "direct",
      createdAt: row.createdAt.toISOString(),
      stats: { totalFiles: 0, assignedRecipients: 0, openRate: 0 },
    },
    { status: 201 }
  );
}
