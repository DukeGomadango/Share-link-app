import { NextResponse } from "next/server";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { isAllowedIntegrationClientId } from "@/lib/integration-oauth";
import {
  pruneOAuthTokensForClient,
  type PruneOAuthKeepStrategy,
} from "@/lib/integration-token-lifecycle";

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { client_id?: string; keep?: PruneOAuthKeepStrategy };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const clientId = body.client_id?.trim() ?? "dango-tools-gacha";
  if (!isAllowedIntegrationClientId(clientId)) {
    return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  }

  const keep = body.keep === "latest_created" ? "latest_created" : "latest_used";

  const { removed, keptId } = await pruneOAuthTokensForClient(
    ctx.workspaceId,
    clientId,
    keep
  );

  return NextResponse.json({
    ok: true,
    client_id: clientId,
    removed,
    kept_id: keptId,
  });
}
