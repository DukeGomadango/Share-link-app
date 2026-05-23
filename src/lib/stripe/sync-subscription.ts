import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { getDb } from "@/db";
import { workspaces } from "@/db/schema";
import { PLAN_LIMITS } from "@/lib/workspace/plan-limits";

import {
  resolveBillingTierFromPriceId,
  type BillingProductTier,
} from "./prices";

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);

function subscriptionPriceId(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  if (!item?.price?.id) {
    return null;
  }
  return typeof item.price === "string" ? item.price : item.price.id;
}

function workspaceIdFromSubscription(
  subscription: Stripe.Subscription
): string | null {
  return (
    subscription.metadata?.workspace_id?.trim() ||
    subscription.items.data[0]?.metadata?.workspace_id?.trim() ||
    null
  );
}

function billingTierForSubscription(
  subscription: Stripe.Subscription
): BillingProductTier | null {
  return resolveBillingTierFromPriceId(subscriptionPriceId(subscription));
}

function metadataBillingTier(
  value: string | undefined
): BillingProductTier | null {
  if (value === "supporter" || value === "pro") {
    return value;
  }
  return null;
}

export async function applyWorkspaceFromSubscription(
  subscription: Stripe.Subscription
): Promise<{ workspaceId: string | null; applied: boolean }> {
  const workspaceId = workspaceIdFromSubscription(subscription);
  if (!workspaceId) {
    console.error("Stripe subscription missing workspace_id metadata");
    return { workspaceId: null, applied: false };
  }

  const db = getDb();
  const periodEndUnix = subscription.items.data[0]?.current_period_end;
  const periodEnd =
    periodEndUnix != null ? new Date(periodEndUnix * 1000) : null;

  if (ACTIVE_STATUSES.has(subscription.status)) {
    const billingTier =
      billingTierForSubscription(subscription) ??
      metadataBillingTier(subscription.metadata?.billing_tier);
    await db
      .update(workspaces)
      .set({
        planTier: "pro",
        storageLimit: PLAN_LIMITS.pro.storageBytes,
        stripeCustomerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id ?? undefined,
        stripeSubscriptionId: subscription.id,
        subscriptionCurrentPeriodEnd: periodEnd,
        billingTier,
      })
      .where(eq(workspaces.id, workspaceId));
    return { workspaceId, applied: true };
  }

  if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid" ||
    subscription.status === "incomplete_expired"
  ) {
    await downgradeWorkspaceToFree(workspaceId);
    return { workspaceId, applied: true };
  }

  return { workspaceId, applied: false };
}

export async function downgradeWorkspaceToFree(workspaceId: string): Promise<void> {
  const db = getDb();
  await db
    .update(workspaces)
    .set({
      planTier: "free",
      storageLimit: PLAN_LIMITS.free.storageBytes,
      stripeSubscriptionId: null,
      subscriptionCurrentPeriodEnd: null,
      billingTier: null,
    })
    .where(eq(workspaces.id, workspaceId));
}

export async function syncSubscriptionById(
  subscriptionId: string,
  stripe: import("stripe").Stripe
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await applyWorkspaceFromSubscription(subscription);
}
