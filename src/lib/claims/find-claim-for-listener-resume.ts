import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  claimIdentityLinks,
  claims,
  campaignRecipientSlots,
  listenerIdentities,
} from "@/db/schema";

/**
 * 公開受付で「チェックイン省略」の対象になる claim を探す。
 * 1) 同一キャンペーンで既にパスキー登録済み（claim_identity_links）
 * 2) listener_identities.linked_recipient_id が名簿と一致し、そのスロットに claim がある場合
 */
export async function findClaimForListenerResume(params: {
  listenerIdentityId: string;
  campaignId: string;
  workspaceId: string;
}): Promise<{ claimId: string; claimSecret: string } | null> {
  const { listenerIdentityId, campaignId, workspaceId } = params;
  const db = getDb();

  const identityRows = await db
    .select({
      workspaceId: listenerIdentities.workspaceId,
      linkedRecipientId: listenerIdentities.linkedRecipientId,
    })
    .from(listenerIdentities)
    .where(eq(listenerIdentities.id, listenerIdentityId))
    .limit(1);

  const identity = identityRows[0];
  if (!identity || identity.workspaceId !== workspaceId) {
    return null;
  }

  const viaPasskeyLink = await db
    .select({
      claimId: claims.id,
      claimSecret: claims.claimSecret,
    })
    .from(claimIdentityLinks)
    .innerJoin(claims, eq(claimIdentityLinks.claimId, claims.id))
    .innerJoin(
      campaignRecipientSlots,
      eq(claims.recipientSlotId, campaignRecipientSlots.id)
    )
    .where(
      and(
        eq(claimIdentityLinks.listenerIdentityId, listenerIdentityId),
        eq(campaignRecipientSlots.campaignId, campaignId)
      )
    )
    .limit(1);

  if (viaPasskeyLink[0]) {
    return {
      claimId: viaPasskeyLink[0].claimId,
      claimSecret: viaPasskeyLink[0].claimSecret,
    };
  }

  if (!identity.linkedRecipientId) {
    return null;
  }

  const viaLinkedRecipient = await db
    .select({
      claimId: claims.id,
      claimSecret: claims.claimSecret,
    })
    .from(claims)
    .innerJoin(
      campaignRecipientSlots,
      eq(claims.recipientSlotId, campaignRecipientSlots.id)
    )
    .where(
      and(
        eq(campaignRecipientSlots.campaignId, campaignId),
        eq(campaignRecipientSlots.recipientId, identity.linkedRecipientId)
      )
    )
    .orderBy(desc(claims.createdAt))
    .limit(1);

  if (viaLinkedRecipient[0]) {
    return {
      claimId: viaLinkedRecipient[0].claimId,
      claimSecret: viaLinkedRecipient[0].claimSecret,
    };
  }

  return null;
}
