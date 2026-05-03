import { resolveIntegrationBearer } from "@/lib/external-auth";
import { handleCorsPreflight, jsonWithCors } from "@/lib/external-cors";
import {
  getCachedJsonResponse,
  putCachedJsonResponse,
} from "@/lib/external-idempotency";
import {
  issueClaimsBatch,
  type IssueClaimItemInput,
} from "@/lib/issue-claims-logic";
import { publicBaseUrlFromRequest } from "@/lib/public-base-url";

const ROUTE_KEY = "POST /api/v1/external/issue-claims";
const MAX_ITEMS = 50;

function normalizeIssueItems(
  raw: unknown,
  request: Request
): IssueClaimItemInput[] | Response {
  if (!Array.isArray(raw)) {
    return jsonWithCors({ error: "invalid_body", message: "items は配列です" }, request, {
      status: 400,
    });
  }
  if (raw.length > MAX_ITEMS) {
    return jsonWithCors(
      { error: "too_many_items", max: MAX_ITEMS },
      request,
      { status: 400 }
    );
  }

  const out: IssueClaimItemInput[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") {
      return jsonWithCors({ error: "invalid_item" }, request, { status: 400 });
    }
    const o = it as Record<string, unknown>;
    const campaign_asset_id = String(
      o.campaign_asset_id ?? o.campaignAssetId ?? ""
    ).trim();
    const external_transaction_id = String(
      o.external_transaction_id ?? o.externalTransactionId ?? ""
    ).trim();
    const recipientRaw =
      o.recipient_display_name ?? o.recipientDisplayName ?? null;
    const recipient_display_name =
      recipientRaw === null || recipientRaw === undefined
        ? null
        : String(recipientRaw).trim() || null;

    if (!campaign_asset_id || !external_transaction_id) {
      return jsonWithCors(
        {
          error: "invalid_item",
          message: "campaign_asset_id と external_transaction_id が必要です",
        },
        request,
        { status: 400 }
      );
    }
    out.push({
      campaign_asset_id,
      external_transaction_id,
      recipient_display_name,
    });
  }
  return out;
}

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  const auth = await resolveIntegrationBearer(request, "claims:issue");
  if (auth instanceof Response) {
    return auth;
  }

  const idemHeader =
    request.headers.get("Idempotency-Key") ??
    request.headers.get("idempotency-key");

  const cached = await getCachedJsonResponse(
    auth.integrationTokenId,
    ROUTE_KEY,
    idemHeader
  );
  if (cached !== null) {
    return jsonWithCors(cached, request);
  }

  let body: { items?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ error: "invalid_json" }, request, { status: 400 });
  }

  if (body.items === undefined) {
    return jsonWithCors({ error: "invalid_body", message: "items が必要です" }, request, {
      status: 400,
    });
  }

  const normalized = normalizeIssueItems(body.items, request);
  if (normalized instanceof Response) {
    return normalized;
  }

  const base = publicBaseUrlFromRequest(request);
  const results = await issueClaimsBatch(
    auth.workspaceId,
    normalized,
    (secret) => `${base}/claim/${encodeURIComponent(secret)}`
  );

  const payload = {
    results: results.map((r) => ({
      external_transaction_id: r.external_transaction_id,
      ok: r.ok,
      claim_url: r.claim_url ?? null,
      error: r.error ?? null,
    })),
  };

  await putCachedJsonResponse(
    auth.integrationTokenId,
    ROUTE_KEY,
    idemHeader,
    payload
  );

  return jsonWithCors(payload, request);
}
