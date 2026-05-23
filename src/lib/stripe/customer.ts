import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { workspaces } from "@/db/schema";

import { getStripeClient } from "./client";

export async function getOrCreateStripeCustomer(
  workspaceId: string,
  email?: string
): Promise<string> {
  const db = getDb();
  const [workspace] = await db
    .select({
      stripeCustomerId: workspaces.stripeCustomerId,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  const stripe = getStripeClient();

  if (workspace?.stripeCustomerId) {
    if (email?.trim()) {
      await stripe.customers.update(workspace.stripeCustomerId, {
        email: email.trim(),
      });
    }
    return workspace.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { workspace_id: workspaceId },
  });

  await db
    .update(workspaces)
    .set({ stripeCustomerId: customer.id })
    .where(eq(workspaces.id, workspaceId));

  return customer.id;
}
