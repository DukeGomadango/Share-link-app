import type Stripe from "stripe";

import { getDb } from "@/db";
import { stripeWebhookEvents } from "@/db/schema";

import { getStripeClient } from "./client";
import {
  applyWorkspaceFromSubscription,
  downgradeWorkspaceToFree,
  syncSubscriptionById,
} from "./sync-subscription";

export async function recordWebhookEventIfNew(eventId: string): Promise<boolean> {
  const db = getDb();
  const inserted = await db
    .insert(stripeWebhookEvents)
    .values({ eventId })
    .onConflictDoNothing()
    .returning({ eventId: stripeWebhookEvents.eventId });

  return inserted.length > 0;
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const stripe = getStripeClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") {
        break;
      }
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (subscriptionId) {
        await syncSubscriptionById(subscriptionId, stripe);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await applyWorkspaceFromSubscription(subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const workspaceId = subscription.metadata?.workspace_id?.trim();
      if (workspaceId) {
        await downgradeWorkspaceToFree(workspaceId);
      }
      break;
    }
    default:
      break;
  }
}
