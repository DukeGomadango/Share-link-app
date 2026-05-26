import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { getDb } from "@/db";
import { claims } from "@/db/schema";
import { isGachaExternalTransactionId } from "@/lib/claims/gacha-external-tx";
import {
  applyGachaSyncToClaim,
  countClaimsOnSlot,
  detachOrPurgeGachaExternalSlot,
  resolveClaimByRecipientId,
  slotHasOtherGachaClaim,
} from "@/lib/claims/gacha-recipient-slot-sync";
import {
  cleanupGachaTestWorkspace,
  insertGachaClaimOnSlot,
  linkClaimToIdentity,
  seedGachaReceptionFixture,
  type GachaTestFixture,
} from "@/lib/claims/gacha-test-fixtures";

const hasDb = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDb)("gacha-recipient-slot-sync (integration)", () => {
  let fixture: GachaTestFixture;

  afterEach(async () => {
    if (fixture?.workspaceId) {
      await cleanupGachaTestWorkspace(getDb(), fixture.workspaceId);
      fixture = undefined as unknown as GachaTestFixture;
    }
  });

  it("resolveClaimByRecipientId reuses reception claim (E2/E3)", async () => {
    const db = getDb();
    fixture = await seedGachaReceptionFixture(db);
    const gachaTx = `gacha-pool-player-${randomUUID()}`;

    const resolved = await resolveClaimByRecipientId(
      db,
      fixture.campaignId,
      fixture.recipientId,
      gachaTx
    );

    expect(resolved).not.toBeNull();
    expect(resolved && "conflict" in resolved).toBe(false);
    if (!resolved || "conflict" in resolved) return;

    expect(resolved.claimId).toBe(fixture.claimId);
    expect(resolved.slotId).toBe(fixture.slotId);
    expect(resolved.resolvedExisting).toBe(true);
  });

  it("returns conflict when another gacha player owns the slot (E10)", async () => {
    const db = getDb();
    fixture = await seedGachaReceptionFixture(db);
    const existingGachaTx = `gacha-pool-player-${randomUUID()}`;
    await db
      .update(claims)
      .set({ externalTransactionId: existingGachaTx })
      .where(eq(claims.id, fixture.claimId));

    const newGachaTx = `gacha-pool-player-${randomUUID()}`;
    const resolved = await resolveClaimByRecipientId(
      db,
      fixture.campaignId,
      fixture.recipientId,
      newGachaTx
    );

    expect(resolved).toEqual({ conflict: true });
    expect(await slotHasOtherGachaClaim(db, fixture.slotId, newGachaTx)).toBe(true);
  });

  it("applyGachaSyncToClaim assigns gacha external_transaction_id", async () => {
    const db = getDb();
    fixture = await seedGachaReceptionFixture(db);
    const gachaTx = `gacha-pool-player-${randomUUID()}`;

    await applyGachaSyncToClaim(db, {
      claimId: fixture.claimId,
      slotId: fixture.slotId,
      externalTxId: gachaTx,
      listenerName: "当選者A",
      listenerNote: "ガチャ連携: 当選者A",
      validatedRecipientId: fixture.recipientId,
      assetIds: [],
    });

    const [row] = await db
      .select({ externalTransactionId: claims.externalTransactionId })
      .from(claims)
      .where(eq(claims.id, fixture.claimId))
      .limit(1);

    expect(row?.externalTransactionId).toBe(gachaTx);
    expect(isGachaExternalTransactionId(row?.externalTransactionId ?? "")).toBe(true);
  });

  it("detach keeps claim and replaces gacha external id (E7/E19)", async () => {
    const db = getDb();
    fixture = await seedGachaReceptionFixture(db);
    const gachaTx = `gacha-pool-player-${randomUUID()}`;

    await applyGachaSyncToClaim(db, {
      claimId: fixture.claimId,
      slotId: fixture.slotId,
      externalTxId: gachaTx,
      listenerName: "当選者A",
      listenerNote: "",
      validatedRecipientId: fixture.recipientId,
      assetIds: [],
    });

    const result = await detachOrPurgeGachaExternalSlot(db, fixture.campaignId, gachaTx, "detach");

    expect(result).toMatchObject({
      ok: true,
      mode: "detach",
      slot_preserved: true,
      detached: true,
    });

    const [row] = await db
      .select({ externalTransactionId: claims.externalTransactionId })
      .from(claims)
      .where(eq(claims.id, fixture.claimId))
      .limit(1);

    expect(row?.externalTransactionId).toMatch(/^recv-/);
    expect(await countClaimsOnSlot(db, fixture.slotId)).toBe(1);
  });

  it("purge with passkey link returns slot_in_use (E19)", async () => {
    const db = getDb();
    fixture = await seedGachaReceptionFixture(db);
    const gachaTx = `gacha-pool-player-${randomUUID()}`;

    await applyGachaSyncToClaim(db, {
      claimId: fixture.claimId,
      slotId: fixture.slotId,
      externalTxId: gachaTx,
      listenerName: "当選者A",
      listenerNote: "",
      validatedRecipientId: fixture.recipientId,
      assetIds: [],
    });
    await linkClaimToIdentity(db, {
      workspaceId: fixture.workspaceId,
      claimId: fixture.claimId,
    });

    const result = await detachOrPurgeGachaExternalSlot(db, fixture.campaignId, gachaTx, "purge");

    expect(result).toEqual({ ok: false, error: "slot_in_use", status: 409 });
    expect(await countClaimsOnSlot(db, fixture.slotId)).toBe(1);
  });

  it("purge deletes slot only when no claims remain (E8)", async () => {
    const db = getDb();
    fixture = await seedGachaReceptionFixture(db);
    const gachaTx = `gacha-pool-player-${randomUUID()}`;

    await applyGachaSyncToClaim(db, {
      claimId: fixture.claimId,
      slotId: fixture.slotId,
      externalTxId: gachaTx,
      listenerName: "当選者A",
      listenerNote: "",
      validatedRecipientId: fixture.recipientId,
      assetIds: [],
    });

    const result = await detachOrPurgeGachaExternalSlot(db, fixture.campaignId, gachaTx, "purge");

    expect(result).toMatchObject({
      ok: true,
      mode: "purge",
      deleted_count: 1,
      slot_preserved: false,
    });
    expect(await countClaimsOnSlot(db, fixture.slotId)).toBe(0);
  });

  it("purge preserves slot when another claim remains (E9)", async () => {
    const db = getDb();
    fixture = await seedGachaReceptionFixture(db);
    const gachaTx = `gacha-pool-player-${randomUUID()}`;
    const otherRecvTx = `recv-${randomUUID()}`;

    await applyGachaSyncToClaim(db, {
      claimId: fixture.claimId,
      slotId: fixture.slotId,
      externalTxId: gachaTx,
      listenerName: "当選者A",
      listenerNote: "",
      validatedRecipientId: fixture.recipientId,
      assetIds: [],
    });

    await insertGachaClaimOnSlot(db, {
      campaignId: fixture.campaignId,
      slotId: fixture.slotId,
      externalTxId: otherRecvTx,
      listenerName: "受付分",
    });

    const result = await detachOrPurgeGachaExternalSlot(db, fixture.campaignId, gachaTx, "purge");

    expect(result).toMatchObject({
      ok: true,
      mode: "purge",
      deleted_count: 1,
      slot_preserved: true,
    });
    expect(await countClaimsOnSlot(db, fixture.slotId)).toBe(1);
  });
});
