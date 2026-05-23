import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { getSessionWorkspaceContext } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/stripe/client";
import { areStripePricesConfigured } from "@/lib/stripe/prices";

export async function GET() {
  const ctx = await getSessionWorkspaceContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [workspace] = await db
    .select({
      planTier: workspaces.planTier,
      billingTier: workspaces.billingTier,
      stripeSubscriptionId: workspaces.stripeSubscriptionId,
      stripeCustomerId: workspaces.stripeCustomerId,
      subscriptionCurrentPeriodEnd: workspaces.subscriptionCurrentPeriodEnd,
    })
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1);

  if (!workspace) {
    return NextResponse.json({ error: "workspace_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    configured: isStripeConfigured() && areStripePricesConfigured(),
    planTier: workspace.planTier,
    billingTier: workspace.billingTier,
    hasSubscription: Boolean(workspace.stripeSubscriptionId),
    hasCustomer: Boolean(workspace.stripeCustomerId),
    subscriptionCurrentPeriodEnd:
      workspace.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
  });
}
