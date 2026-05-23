import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { publicBaseUrlFromRequest } from "@/lib/public-base-url";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/client";
import {
  areStripePricesConfigured,
  getStripePriceId,
  type BillingInterval,
  type BillingProductTier,
} from "@/lib/stripe/prices";

function parseBody(
  body: unknown
): { tier: BillingProductTier; interval: BillingInterval } | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const tier = (body as { tier?: string }).tier;
  const interval = (body as { interval?: string }).interval;
  if (
    (tier !== "pro" && tier !== "supporter") ||
    (interval !== "month" && interval !== "year")
  ) {
    return null;
  }
  return { tier, interval };
}

export async function POST(request: Request) {
  if (!isStripeConfigured() || !areStripePricesConfigured()) {
    return NextResponse.json(
      { error: "billing_unavailable", message: "Stripe が未設定です" },
      { status: 503 }
    );
  }

  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseBody(json);
  if (!parsed) {
    return NextResponse.json(
      { error: "invalid_params", message: "tier と interval が必要です" },
      { status: 400 }
    );
  }

  const priceId = getStripePriceId(parsed.tier, parsed.interval);
  if (!priceId) {
    return NextResponse.json({ error: "price_not_configured" }, { status: 503 });
  }

  const db = getDb();
  const [workspace] = await db
    .select({
      planTier: workspaces.planTier,
      billingTier: workspaces.billingTier,
      stripeSubscriptionId: workspaces.stripeSubscriptionId,
    })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1);

  if (!workspace) {
    return NextResponse.json({ error: "workspace_not_found" }, { status: 404 });
  }

  if (workspace.planTier === "pro" && workspace.stripeSubscriptionId) {
    const message =
      parsed.tier === "supporter" && workspace.billingTier !== "supporter"
        ? "Pro からサポーターへは、プラン画面の「サポーターに変更」からお申し込みください。"
        : "すでに有料プランです。プラン管理から変更・解約してください。";
    return NextResponse.json(
      {
        error: "already_subscribed",
        message,
      },
      { status: 409 }
    );
  }

  const baseUrl = publicBaseUrlFromRequest(request);
  const customerId = await getOrCreateStripeCustomer(ctx.workspaceId, ctx.email);
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: ctx.workspaceId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      workspace_id: ctx.workspaceId,
      billing_tier: parsed.tier,
    },
    subscription_data: {
      metadata: {
        workspace_id: ctx.workspaceId,
        billing_tier: parsed.tier,
      },
    },
    success_url: `${baseUrl}/settings/billing?checkout=success`,
    cancel_url: `${baseUrl}/settings/billing?checkout=cancel`,
    billing_address_collection: "auto",
    // customer_update に email はない（basil 以降）。住所などは auto 可。
    customer_update: {
      address: "auto",
      name: "auto",
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "checkout_session_failed" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
