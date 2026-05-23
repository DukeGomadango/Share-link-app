import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import type { getDb } from "@/db";
import {
  campaignRecipientSlots,
  campaigns,
  claimIdentityLinks,
  claims,
  listenerIdentities,
  recipients,
  workspaces,
} from "@/db/schema";

type Db = ReturnType<typeof getDb>;

export type GachaTestFixture = {
  workspaceId: string;
  campaignId: string;
  recipientId: string;
  slotId: string;
  claimId: string;
  claimSecret: string;
  receptionExternalTxId: string;
};

export async function seedGachaReceptionFixture(
  db: Db,
  opts?: { listenerName?: string }
): Promise<GachaTestFixture> {
  const workspaceId = randomUUID();
  const campaignId = randomUUID();
  const recipientId = randomUUID();
  const slotId = randomUUID();
  const claimId = randomUUID();
  const claimSecret = randomUUID();
  const receptionExternalTxId = `recv-${randomUUID()}`;
  const listenerName = opts?.listenerName ?? "テストリスナー";

  await db.insert(workspaces).values({
    id: workspaceId,
    name: `gacha-test-${workspaceId.slice(0, 8)}`,
  });

  await db.insert(campaigns).values({
    id: campaignId,
    workspaceId,
    name: "gacha integration test",
    status: "active",
    securityLevel: "high",
    distributionMode: "reception",
    isExternalLinked: true,
    publicReceptionToken: `recv-${randomUUID().replace(/-/g, "")}`,
  });

  await db.insert(recipients).values({
    id: recipientId,
    workspaceId,
    name: listenerName,
  });

  await db.insert(campaignRecipientSlots).values({
    id: slotId,
    campaignId,
    recipientId,
    status: "unlinked",
    listenerDisplayName: listenerName,
    listenerNote: "受付チェックイン",
  });

  await db.insert(claims).values({
    id: claimId,
    campaignId,
    recipientSlotId: slotId,
    externalTransactionId: receptionExternalTxId,
    claimSecret,
    recipientDisplayName: listenerName,
    status: "issued",
  });

  return {
    workspaceId,
    campaignId,
    recipientId,
    slotId,
    claimId,
    claimSecret,
    receptionExternalTxId,
  };
}

export async function insertGachaClaimOnSlot(
  db: Db,
  input: {
    campaignId: string;
    slotId: string;
    externalTxId: string;
    listenerName?: string;
  }
): Promise<{ claimId: string }> {
  const claimId = randomUUID();
  await db.insert(claims).values({
    id: claimId,
    campaignId: input.campaignId,
    recipientSlotId: input.slotId,
    externalTransactionId: input.externalTxId,
    claimSecret: randomUUID(),
    recipientDisplayName: input.listenerName ?? "ガチャプレイヤー",
    status: "issued",
  });
  return { claimId };
}

export async function linkClaimToIdentity(
  db: Db,
  input: { workspaceId: string; claimId: string }
): Promise<void> {
  const listenerIdentityId = randomUUID();
  await db.insert(listenerIdentities).values({
    id: listenerIdentityId,
    workspaceId: input.workspaceId,
  });
  await db.insert(claimIdentityLinks).values({
    claimId: input.claimId,
    listenerIdentityId,
  });
}

export async function cleanupGachaTestWorkspace(
  db: Db,
  workspaceId: string
): Promise<void> {
  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
}
