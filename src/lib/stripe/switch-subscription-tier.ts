import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { workspaces } from "@/db/schema";

import { getStripeClient } from "./client";
import { getStripePriceId, type BillingInterval } from "./prices";
import { applyWorkspaceFromSubscription } from "./sync-subscription";

export async function switchSubscriptionToSupporter(
  workspaceId: string,
  interval: BillingInterval
): Promise<{ ok: true } | { ok: false; message: string }> {
  const priceId = getStripePriceId("supporter", interval);
  if (!priceId) {
    return { ok: false, message: "サポーター Price が未設定です" };
  }

  const db = getDb();
  const [workspace] = await db
    .select({
      stripeSubscriptionId: workspaces.stripeSubscriptionId,
      billingTier: workspaces.billingTier,
      planTier: workspaces.planTier,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace?.stripeSubscriptionId) {
    return { ok: false, message: "有効なサブスクリプションがありません" };
  }

  if (workspace.planTier !== "pro") {
    return { ok: false, message: "有料プラン加入者のみ変更できます" };
  }

  if (workspace.billingTier === "supporter") {
    return { ok: false, message: "すでにサポータープランです" };
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(
    workspace.stripeSubscriptionId
  );
  const item = subscription.items.data[0];
  if (!item?.id) {
    return { ok: false, message: "サブスクリプション項目を取得できませんでした" };
  }

  const updated = await stripe.subscriptions.update(subscription.id, {
    items: [{ id: item.id, price: priceId }],
    proration_behavior: "create_prorations",
    metadata: {
      ...subscription.metadata,
      workspace_id: workspaceId,
      billing_tier: "supporter",
    },
  });

  await applyWorkspaceFromSubscription(updated);
  return { ok: true };
}
