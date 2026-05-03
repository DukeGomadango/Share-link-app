import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { workspaceMembers, workspaces } from "@/db/schema";

function workspaceNameFromUser(email: string | undefined, fallback: string | undefined): string {
  if (fallback?.trim()) {
    return `${fallback.trim()}のWorkspace`;
  }
  const local = email?.split("@")[0]?.trim();
  if (local) {
    return `${local}のWorkspace`;
  }
  return "マイワークスペース";
}

/**
 * 初回ログイン時に個人用 Workspace とメンバー 1 件を作成する（Phase 1: RBAC なし）。
 */
export async function ensurePersonalWorkspace(
  userId: string,
  options: { email?: string; displayName?: string }
): Promise<string> {
  const db = getDb();
  const existing = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  if (existing[0]) {
    return existing[0].workspaceId;
  }

  const name = workspaceNameFromUser(options.email, options.displayName);

  const [ws] = await db
    .insert(workspaces)
    .values({ name })
    .returning({ id: workspaces.id });

  await db.insert(workspaceMembers).values({
    workspaceId: ws.id,
    userId,
  });

  return ws.id;
}
