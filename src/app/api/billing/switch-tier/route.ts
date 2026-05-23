import { NextResponse } from "next/server";

import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/stripe/client";
import { areStripePricesConfigured } from "@/lib/stripe/prices";
import type { BillingInterval } from "@/lib/stripe/prices";
import { switchSubscriptionToSupporter } from "@/lib/stripe/switch-subscription-tier";

function parseInterval(body: unknown): BillingInterval | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const interval = (body as { interval?: string }).interval;
  if (interval !== "month" && interval !== "year") {
    return null;
  }
  return interval;
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

  const interval = parseInterval(json);
  if (!interval) {
    return NextResponse.json(
      { error: "invalid_params", message: "interval（month / year）が必要です" },
      { status: 400 }
    );
  }

  try {
    const result = await switchSubscriptionToSupporter(ctx.workspaceId, interval);
    if (!result.ok) {
      return NextResponse.json(
        { error: "switch_failed", message: result.message },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("switch-tier failed", err);
    return NextResponse.json(
      {
        error: "switch_failed",
        message: "プラン変更に失敗しました。しばらくしてからお試しください。",
      },
      { status: 500 }
    );
  }
}
