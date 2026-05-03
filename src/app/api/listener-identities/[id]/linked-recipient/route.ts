import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { getDb } from "@/db";
import { listenerIdentities, recipients } from "@/db/schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteParams = { params: Promise<{ id: string }> };

/**
 * リスナー本人（WebAuthn）と名簿の受取人を紐づける（同じ workspace のみ）。
 * ダッシュボード等から呼び出し、事前登録受取人と再訪のパスキー再開を接続する。
 */
export async function PATCH(request: Request, ctx: RouteParams) {
  const session = await getSessionWorkspaceContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: identityId } = await ctx.params;
  if (!identityId || !UUID_RE.test(identityId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  let body: { recipientId: string | null };
  try {
    body = (await request.json()) as { recipientId: string | null };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const db = getDb();
  const identRows = await db
    .select({ id: listenerIdentities.id, workspaceId: listenerIdentities.workspaceId })
    .from(listenerIdentities)
    .where(
      and(
        eq(listenerIdentities.id, identityId),
        eq(listenerIdentities.workspaceId, session.workspaceId)
      )
    )
    .limit(1);

  if (!identRows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let linked: string | null = null;
  if (body.recipientId != null) {
    const rid = String(body.recipientId).trim();
    if (!UUID_RE.test(rid)) {
      return NextResponse.json({ error: "invalid_recipient_id" }, { status: 400 });
    }
    const rec = await db
      .select({ id: recipients.id })
      .from(recipients)
      .where(
        and(eq(recipients.id, rid), eq(recipients.workspaceId, session.workspaceId))
      )
      .limit(1);
    if (!rec[0]) {
      return NextResponse.json({ error: "recipient_not_found" }, { status: 404 });
    }
    linked = rid;
  }

  await db
    .update(listenerIdentities)
    .set({ linkedRecipientId: linked })
    .where(eq(listenerIdentities.id, identityId));

  return NextResponse.json({ ok: true, linkedRecipientId: linked });
}
