import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import type { getDb } from "@/db";
import {
  campaignRecipientSlots,
  claimAssets,
  claimIdentityLinks,
  claims,
  slotAssets,
} from "@/db/schema";
import { isGachaExternalTransactionId } from "@/lib/claims/gacha-external-tx";
import { recomputeSlotAssetsFromClaims } from "@/lib/claims/recompute-slot-assets";

type Db = ReturnType<typeof getDb>;

export type GachaResolvedClaim = {
  claimId: string;
  claimSecret: string;
  slotId: string;
  resolvedExisting: boolean;
};

export type ResolveGachaSlotResult =
  | GachaResolvedClaim
  | { conflict: true };

/** スロット上に別ガチャプレイヤーの Claim があるか */
export async function slotHasOtherGachaClaim(
  db: Db,
  slotId: string,
  externalTxId: string
): Promise<boolean> {
  const rows = await db
    .select({ externalTransactionId: claims.externalTransactionId })
    .from(claims)
    .where(eq(claims.recipientSlotId, slotId));

  return rows.some(
    (r) =>
      isGachaExternalTransactionId(r.externalTransactionId) &&
      r.externalTransactionId !== externalTxId
  );
}

/**
 * 名簿 ID でキャンペーン内スロットを解決し、ガチャ同期用 Claim を返す。
 */
export async function resolveClaimByRecipientId(
  db: Db,
  campaignId: string,
  recipientId: string,
  externalTxId: string
): Promise<ResolveGachaSlotResult | null> {
  const slots = await db
    .select({
      slotId: campaignRecipientSlots.id,
    })
    .from(campaignRecipientSlots)
    .where(
      and(
        eq(campaignRecipientSlots.campaignId, campaignId),
        eq(campaignRecipientSlots.recipientId, recipientId)
      )
    );

  if (slots.length === 0) return null;

  let best: GachaResolvedClaim | null = null;
  let bestUpdated = 0;

  for (const { slotId } of slots) {
    if (await slotHasOtherGachaClaim(db, slotId, externalTxId)) {
      return { conflict: true };
    }

    const claimRows = await db
      .select({
        claimId: claims.id,
        claimSecret: claims.claimSecret,
        updatedAt: claims.updatedAt,
        externalTransactionId: claims.externalTransactionId,
      })
      .from(claims)
      .where(eq(claims.recipientSlotId, slotId))
      .orderBy(desc(claims.updatedAt));

    if (claimRows.length === 0) continue;

    const preferred =
      claimRows.find((c) => c.externalTransactionId === externalTxId) ??
      claimRows.find((c) => !isGachaExternalTransactionId(c.externalTransactionId)) ??
      claimRows[0];

    if (!preferred) continue;

    const ts = preferred.updatedAt?.getTime() ?? 0;
    if (!best || ts > bestUpdated) {
      bestUpdated = ts;
      best = {
        claimId: preferred.claimId,
        claimSecret: preferred.claimSecret,
        slotId,
        resolvedExisting: true,
      };
    }
  }

  return best;
}

export async function applyGachaSyncToClaim(
  db: Db,
  input: {
    claimId: string;
    slotId: string;
    externalTxId: string;
    listenerName: string;
    listenerNote: string;
    validatedRecipientId: string | null;
    assetIds: string[];
  }
): Promise<{ linked_asset_count: number; slot_status: "ready" | "unlinked" }> {
  const {
    claimId,
    slotId,
    externalTxId,
    listenerName,
    listenerNote,
    validatedRecipientId,
    assetIds,
  } = input;

  await db
    .update(campaignRecipientSlots)
    .set({
      listenerDisplayName: listenerName,
      listenerNote: listenerNote || `ガチャ連携: ${listenerName}`,
      ...(validatedRecipientId ? { recipientId: validatedRecipientId } : {}),
    })
    .where(eq(campaignRecipientSlots.id, slotId));

  await db
    .update(claims)
    .set({
      externalTransactionId: externalTxId,
      recipientDisplayName: listenerName,
      updatedAt: new Date(),
    })
    .where(eq(claims.id, claimId));

  const currentClaimAssets = await db
    .select({ campaignAssetId: claimAssets.campaignAssetId })
    .from(claimAssets)
    .where(eq(claimAssets.claimId, claimId));

  const currentIds = new Set(currentClaimAssets.map((ca) => ca.campaignAssetId));
  const newIds = new Set(assetIds);
  const isSame =
    currentIds.size === newIds.size &&
    [...newIds].every((id) => currentIds.has(id));

  if (!isSame) {
    await db.delete(claimAssets).where(eq(claimAssets.claimId, claimId));
    if (assetIds.length > 0) {
      await db.insert(claimAssets).values(
        assetIds.map((campaignAssetId) => ({
          claimId,
          campaignAssetId,
        }))
      );
    }
    await recomputeSlotAssetsFromClaims(db, slotId);
  }

  const [slotAssetCount] = await db
    .select({ id: slotAssets.slotId })
    .from(slotAssets)
    .where(eq(slotAssets.slotId, slotId))
    .limit(1);

  const slotStatus = slotAssetCount ? "ready" : "unlinked";
  await db
    .update(campaignRecipientSlots)
    .set({ status: slotStatus })
    .where(eq(campaignRecipientSlots.id, slotId));

  return { linked_asset_count: assetIds.length, slot_status: slotStatus };
}

export async function countClaimsOnSlot(db: Db, slotId: string): Promise<number> {
  const rows = await db
    .select({ id: claims.id })
    .from(claims)
    .where(eq(claims.recipientSlotId, slotId));
  return rows.length;
}

export type DetachGachaResult =
  | {
      ok: true;
      mode: "detach" | "purge";
      deleted_count: number;
      slot_preserved: boolean;
      detached?: boolean;
    }
  | { ok: false; error: "slot_in_use"; status: 409 };

export async function detachOrPurgeGachaExternalSlot(
  db: Db,
  externalTxId: string,
  mode: "detach" | "purge"
): Promise<DetachGachaResult> {
  const [claim] = await db
    .select({
      id: claims.id,
      recipientSlotId: claims.recipientSlotId,
    })
    .from(claims)
    .where(eq(claims.externalTransactionId, externalTxId))
    .limit(1);

  if (!claim) {
    return {
      ok: true,
      mode,
      deleted_count: 0,
      slot_preserved: true,
    };
  }

  const slotId = claim.recipientSlotId;

  if (mode === "purge") {
    const [identityLink] = await db
      .select({ claimId: claimIdentityLinks.claimId })
      .from(claimIdentityLinks)
      .where(eq(claimIdentityLinks.claimId, claim.id))
      .limit(1);

    if (identityLink) {
      return { ok: false, error: "slot_in_use", status: 409 };
    }

    await db.delete(claimAssets).where(eq(claimAssets.claimId, claim.id));
    await db.delete(claims).where(eq(claims.id, claim.id));

    if (slotId) {
      const remaining = await countClaimsOnSlot(db, slotId);
      if (remaining === 0) {
        await db
          .delete(campaignRecipientSlots)
          .where(eq(campaignRecipientSlots.id, slotId));
        return {
          ok: true,
          mode: "purge",
          deleted_count: 1,
          slot_preserved: false,
        };
      }
      await recomputeSlotAssetsFromClaims(db, slotId);
      return {
        ok: true,
        mode: "purge",
        deleted_count: 1,
        slot_preserved: true,
      };
    }

    return {
      ok: true,
      mode: "purge",
      deleted_count: 1,
      slot_preserved: true,
    };
  }

  // detach: Claim 行は残し、ガチャ紐づけと資産だけ解除
  await db.delete(claimAssets).where(eq(claimAssets.claimId, claim.id));
  await db
    .update(claims)
    .set({
      externalTransactionId: `recv-${randomUUID()}`,
      updatedAt: new Date(),
    })
    .where(eq(claims.id, claim.id));

  if (slotId) {
    await recomputeSlotAssetsFromClaims(db, slotId);
    const [slotAssetCount] = await db
      .select({ id: slotAssets.slotId })
      .from(slotAssets)
      .where(eq(slotAssets.slotId, slotId))
      .limit(1);
    await db
      .update(campaignRecipientSlots)
      .set({ status: slotAssetCount ? "ready" : "unlinked" })
      .where(eq(campaignRecipientSlots.id, slotId));
  }

  return {
    ok: true,
    mode: "detach",
    deleted_count: 0,
    slot_preserved: true,
    detached: true,
  };
}
