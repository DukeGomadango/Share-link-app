import { NextResponse } from "next/server";

import { buildClaimPageUrl } from "@/lib/claims/base-url";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import {
  issueClaimsBatch,
  type IssueClaimItemInput,
} from "@/lib/issue-claims-logic";

const MAX_ITEMS = 50;

export async function POST(request: Request) {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { items?: IssueClaimItemInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = body.items ?? [];
  if (items.length === 0) {
    return NextResponse.json({ error: "items が空です" }, { status: 400 });
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `items は最大 ${MAX_ITEMS} 件です` },
      { status: 400 }
    );
  }

  const results = await issueClaimsBatch(ctx.workspaceId, items, (secret) =>
    buildClaimPageUrl(request, secret)
  );

  return NextResponse.json({ results });
}
