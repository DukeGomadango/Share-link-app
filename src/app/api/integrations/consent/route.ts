import { getSessionWorkspaceContext } from "@/lib/auth/session";
import {
  isAllowedIntegrationClientId,
  isRedirectUriAllowed,
} from "@/lib/integration-oauth";
import { generateIntegrationTokenPlain, hashIntegrationToken } from "@/lib/integration-token";
import { getDb } from "@/db";
import { integrationAccessTokens } from "@/db/schema";

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    client_id?: string;
    redirect_uri?: string;
    state?: string;
    label?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clientId = body.client_id?.trim() ?? "";
  const redirectUri = body.redirect_uri?.trim() ?? "";

  if (!isAllowedIntegrationClientId(clientId)) {
    return Response.json({ error: "invalid_client" }, { status: 400 });
  }
  if (!redirectUri || !isRedirectUriAllowed(redirectUri)) {
    return Response.json({ error: "invalid_redirect_uri" }, { status: 400 });
  }

  const plain = generateIntegrationTokenPlain();
  const tokenHash = hashIntegrationToken(plain);
  const label =
    body.label?.trim() ||
    `OAuth連携 (${clientId})`;

  const db = getDb();
  await db.insert(integrationAccessTokens).values({
    workspaceId: ctx.workspaceId,
    label,
    tokenHash,
    scopes: "campaigns:read,claims:issue",
  });

  const u = new URL(redirectUri);
  u.searchParams.set("integration_token", plain);
  if (body.state) {
    u.searchParams.set("state", body.state);
  }

  return Response.json({ redirectUrl: u.toString() });
}
