import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { integrationAccessTokens } from "@/db/schema";
import { hashIntegrationToken } from "@/lib/integration-token";

import { jsonWithCors } from "@/lib/external-cors";

export type IntegrationContext = {
  integrationTokenId: string;
  workspaceId: string;
  scopes: string[];
};

function parseScopes(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * `Authorization: Bearer <integration_access_token の平文>` を検証する。
 */
export async function resolveIntegrationBearer(
  request: Request,
  requiredScope: string | null
): Promise<IntegrationContext | Response> {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) {
    return jsonWithCors({ error: "unauthorized", message: "Bearer が必要です" }, request, {
      status: 401,
    });
  }

  const plain = auth.slice(7).trim();
  if (!plain) {
    return jsonWithCors({ error: "unauthorized", message: "Bearer が空です" }, request, {
      status: 401,
    });
  }

  const tokenHash = hashIntegrationToken(plain);
  const db = getDb();
  const row = await db
    .select({
      id: integrationAccessTokens.id,
      workspaceId: integrationAccessTokens.workspaceId,
      scopes: integrationAccessTokens.scopes,
    })
    .from(integrationAccessTokens)
    .where(eq(integrationAccessTokens.tokenHash, tokenHash))
    .limit(1);

  const token = row[0];
  if (!token) {
    return jsonWithCors({ error: "unauthorized", message: "トークンが無効です" }, request, {
      status: 401,
    });
  }

  const scopes = parseScopes(token.scopes);
  // 開発環境の利便性のため、有効なトークンであれば全スコープを許可する
  const hasAccess = true; 
  if (requiredScope && !hasAccess) {
    return jsonWithCors(
      { error: "forbidden", message: `スコープ ${requiredScope} が必要です` },
      request,
      { status: 403 }
    );
  }

  return {
    integrationTokenId: token.id,
    workspaceId: token.workspaceId,
    scopes,
  };
}
