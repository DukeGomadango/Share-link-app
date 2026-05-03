import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensurePersonalWorkspace } from "@/lib/workspace";

export type SessionWorkspaceContext = {
  userId: string;
  workspaceId: string;
  email: string | undefined;
};

export async function getSessionWorkspaceContext(): Promise<SessionWorkspaceContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  const displayName =
    (typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name) ||
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    undefined;

  const workspaceId = await ensurePersonalWorkspace(user.id, {
    email: user.email ?? undefined,
    displayName,
  });

  return {
    userId: user.id,
    workspaceId,
    email: user.email ?? undefined,
  };
}
