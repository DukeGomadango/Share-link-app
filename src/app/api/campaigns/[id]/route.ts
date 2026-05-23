import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { fetchCampaignWithStats } from "@/lib/campaigns-query";
import { dbStatusFromUi } from "@/lib/campaign-status";
import { getDb } from "@/db";
import { campaigns } from "@/db/schema";
import {
  patchForEnablingExternalLink,
  rejectsExternalLinkLockedFieldChange,
} from "@/lib/campaigns/external-link-mode";
import { ensurePublicReceptionToken } from "@/lib/campaigns/public-reception-token";

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

  let body: {
    name?: string;
    status?: string;
    distributionMode?: string;
    expiresAt?: string | null;
    securityLevel?: string;
    isExternalLinked?: boolean;
    gachaConfig?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = getDb();

  const [current] = await db
    .select({
      securityLevel: campaigns.securityLevel,
      distributionMode: campaigns.distributionMode,
      status: campaigns.status,
      isExternalLinked: campaigns.isExternalLinked,
      gachaConfig: campaigns.gachaConfig,
    })
    .from(campaigns)
    .where(and(eq(campaigns.workspaceId, ctx.workspaceId), eq(campaigns.id, id)))
    .limit(1);

  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const lockReject = rejectsExternalLinkLockedFieldChange(current, body);
  if (lockReject) {
    return NextResponse.json({ error: "integration_locked", message: lockReject }, { status: 403 });
  }

  type Patch = {
    name?: string;
    status?: (typeof campaigns.$inferSelect)["status"];
    distributionMode?: string;
    expiresAt?: Date | null;
    securityLevel?: "standard" | "high";
    isExternalLinked?: boolean;
    gachaConfig?: unknown;
  };
  const patch: Patch = {};

  if (body.name !== undefined) {
    const n = body.name.trim();
    if (n) {
      patch.name = n;
    }
  }

  if (body.status !== undefined) {
    const raw = body.status;
    if (raw !== "draft" && raw !== "active" && raw !== "completed") {
      return NextResponse.json({ error: "status が不正です" }, { status: 400 });
    }
    patch.status = dbStatusFromUi(raw);
  }

  if (body.distributionMode !== undefined) {
    const m = body.distributionMode;
    if (m !== "per_link" && m !== "reception") {
      return NextResponse.json({ error: "distributionMode が不正です" }, { status: 400 });
    }
    patch.distributionMode = m;
  }

  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null) {
      patch.expiresAt = null;
    } else {
      const d = new Date(body.expiresAt);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "expiresAt が不正な形式です" }, { status: 400 });
      }
      patch.expiresAt = d;
    }
  }

  if (body.securityLevel !== undefined) {
    const s = body.securityLevel;
    if (s !== "standard" && s !== "high") {
      return NextResponse.json({ error: "securityLevel が不正です" }, { status: 400 });
    }
    patch.securityLevel = s;
  }
  
  if (body.isExternalLinked !== undefined) {
    if (body.isExternalLinked) {
      Object.assign(patch, patchForEnablingExternalLink());
    } else {
      patch.isExternalLinked = false;
    }
  }
  
  if (body.gachaConfig !== undefined) {
    patch.gachaConfig = body.gachaConfig;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "更新項目がありません" }, { status: 400 });
  }

  const enablingLink = body.isExternalLinked === true;

  const updated = await db
    .update(campaigns)
    .set(patch as Record<string, unknown>)
    .where(and(eq(campaigns.workspaceId, ctx.workspaceId), eq(campaigns.id, id)))
    .returning({ id: campaigns.id });

  if (!updated[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (enablingLink) {
    await ensurePublicReceptionToken(id);
  }

  const row = await fetchCampaignWithStats(ctx.workspaceId, id);
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const deleted = await db
    .delete(campaigns)
    .where(and(eq(campaigns.workspaceId, ctx.workspaceId), eq(campaigns.id, id)))
    .returning({ id: campaigns.id });

  if (!deleted[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
