import { randomBytes, randomUUID } from "node:crypto";

import { getDb } from "@/db";
import { campaignRecipientSlots, claims } from "@/db/schema";

export type CreateSlotAndClaimInput = {
  campaignId: string;
  listenerDisplayName: string;
  listenerNote?: string | null;
  /** グローバル名簿の受取人 ID（連携時に指定） */
  recipientId?: string | null;
};

export type CreateSlotAndClaimResult = {
  claimSecret: string;
  claimId: string;
  slotId: string;
};

export async function createSlotAndClaim(
  input: CreateSlotAndClaimInput
): Promise<CreateSlotAndClaimResult> {
  const db = getDb();
  const secret = randomBytes(32).toString("base64url");
  const name = input.listenerDisplayName.trim();

  const [slot] = await db
    .insert(campaignRecipientSlots)
    .values({
      campaignId: input.campaignId,
      recipientId: input.recipientId ?? undefined,
      listenerDisplayName: name,
      listenerNote: input.listenerNote?.trim() || null,
      status: "unlinked",
    })
    .returning({ id: campaignRecipientSlots.id });

  if (!slot) {
    throw new Error("slot insert failed");
  }

  const [claim] = await db
    .insert(claims)
    .values({
      recipientSlotId: slot.id,
      campaignId: input.campaignId,
      externalTransactionId: `recv-${randomUUID()}`,
      claimSecret: secret,
      recipientDisplayName: name,
      status: "issued",
    })
    .returning({ id: claims.id, claimSecret: claims.claimSecret });

  if (!claim) {
    throw new Error("claim insert failed");
  }

  return {
    claimSecret: claim.claimSecret,
    claimId: claim.id,
    slotId: slot.id,
  };
}
