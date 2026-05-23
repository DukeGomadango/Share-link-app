import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { publicBaseUrlFromRequest } from "@/lib/public-base-url";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/client";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "billing_unavailable", message: "Stripe が未設定です" },
      { status: 503 }
    );
  }

  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [workspace] = await db
    .select({ stripeCustomerId: workspaces.stripeCustomerId })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1);

  if (!workspace?.stripeCustomerId) {
    return NextResponse.json(
      {
        error: "no_customer",
        message: "有料プランに未加入です。まずプランを選択してください。",
      },
      { status: 400 }
    );
  }

  const baseUrl = publicBaseUrlFromRequest(request);
  const stripe = getStripeClient();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${baseUrl}/settings/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
