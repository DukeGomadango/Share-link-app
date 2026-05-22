import { desc, eq, and, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { recipients, listenerIdentities, claims, campaignRecipientSlots, campaigns } from "@/db/schema";
import type { Recipient, RecipientStatus } from "@/components/features/campaigns/types";

export async function fetchRecipients(workspaceId: string): Promise<Recipient[]> {
  const db = getDb();
  const list = await db
    .select()
    .from(recipients)
    .where(eq(recipients.workspaceId, workspaceId))
    .orderBy(desc(recipients.updatedAt));

  if (list.length === 0) return [];

  const recipientIds = list.map(r => r.id);

  // Get listener identities to check 'verified' status
  const identities = await db
    .select({ recipientId: listenerIdentities.linkedRecipientId })
    .from(listenerIdentities)
    .where(eq(listenerIdentities.workspaceId, workspaceId));

  const verifiedRecipientIds = new Set(identities.map(i => i.recipientId).filter(Boolean) as string[]);

  // Get claimed status
  const claimedRecipients = await db
    .select({ recipientId: campaignRecipientSlots.recipientId })
    .from(claims)
    .innerJoin(campaignRecipientSlots, eq(claims.recipientSlotId, campaignRecipientSlots.id))
    .where(and(
      eq(claims.status, 'claimed'),
      inArray(campaignRecipientSlots.recipientId, recipientIds)
    ));
  
  const claimedRecipientIds = new Set(claimedRecipients.map(r => r.recipientId).filter(Boolean) as string[]);

  return list.map(row => {
    let status: RecipientStatus = 'waiting';
    if (claimedRecipientIds.has(row.id)) {
      status = 'claimed';
    } else if (verifiedRecipientIds.has(row.id)) {
      status = 'verified';
    }

    return {
      id: row.id,
      name: row.name,
      tags: (row.tags as string[]) ?? [],
      platformId: row.platformId ?? undefined,
      listenerNote: row.listenerNote ?? undefined,
      status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      passkeyVerified: verifiedRecipientIds.has(row.id),
    };
  });
}

export async function fetchRecipientHistory(workspaceId: string, recipientId: string) {
  const db = getDb();
  const history = await db
    .select({
      id: claims.id,
      campaignName: campaigns.name,
      claimStatus: claims.status,
      date: claims.createdAt,
      token: claims.claimSecret,
      expiresAt: campaigns.expiresAt,
    })
    .from(claims)
    .innerJoin(campaignRecipientSlots, eq(claims.recipientSlotId, campaignRecipientSlots.id))
    .innerJoin(campaigns, eq(campaignRecipientSlots.campaignId, campaigns.id))
    .where(and(
      eq(campaignRecipientSlots.recipientId, recipientId),
      eq(campaigns.workspaceId, workspaceId)
    ))
    .orderBy(desc(claims.createdAt));

  const now = new Date();

  return history.map(h => {
    let status: "opened" | "unopened" | "expired" = h.claimStatus === 'claimed' ? 'opened' : 'unopened';
    if (status === 'unopened' && h.expiresAt && new Date(h.expiresAt) < now) {
      status = 'expired';
    }

    return {
      id: h.id,
      campaignName: h.campaignName,
      fileName: "配布セット（複数ファイル）",
      status,
      date: h.date.toISOString(),
      token: h.token,
    };
  });
}
