import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { integrationIdempotencyKeys } from "@/db/schema";
import { hashIntegrationToken } from "@/lib/integration-token";

/** Idempotency-Key のレスポンス再利用 TTL（契約どおり短め。既定 24h） */
const TTL_MS =
  Number(process.env.EXTERNAL_IDEMPOTENCY_TTL_MS ?? "") || 24 * 60 * 60 * 1000;

export function hashIdempotencyKey(raw: string): string {
  return hashIntegrationToken(`idempotency:${raw.trim()}`);
}

export async function getCachedJsonResponse(
  integrationTokenId: string,
  routeKey: string,
  idempotencyHeader: string | null
): Promise<unknown | null> {
  if (!idempotencyHeader?.trim()) {
    return null;
  }

  const keyHash = hashIdempotencyKey(idempotencyHeader);
  const db = getDb();
  const row = await db
    .select({
      responseBody: integrationIdempotencyKeys.responseBody,
      expiresAt: integrationIdempotencyKeys.expiresAt,
      id: integrationIdempotencyKeys.id,
    })
    .from(integrationIdempotencyKeys)
    .where(
      and(
        eq(integrationIdempotencyKeys.integrationTokenId, integrationTokenId),
        eq(integrationIdempotencyKeys.routeKey, routeKey),
        eq(integrationIdempotencyKeys.idempotencyKeyHash, keyHash)
      )
    )
    .limit(1);

  const hit = row[0];
  if (!hit) {
    return null;
  }
  if (hit.expiresAt.getTime() < Date.now()) {
    await db
      .delete(integrationIdempotencyKeys)
      .where(eq(integrationIdempotencyKeys.id, hit.id));
    return null;
  }

  return hit.responseBody;
}

export async function putCachedJsonResponse(
  integrationTokenId: string,
  routeKey: string,
  idempotencyHeader: string | null,
  responseBody: unknown
): Promise<void> {
  if (!idempotencyHeader?.trim()) {
    return;
  }

  const keyHash = hashIdempotencyKey(idempotencyHeader);
  const db = getDb();
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db
    .insert(integrationIdempotencyKeys)
    .values({
      integrationTokenId,
      routeKey,
      idempotencyKeyHash: keyHash,
      responseBody: responseBody as object,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [
        integrationIdempotencyKeys.integrationTokenId,
        integrationIdempotencyKeys.routeKey,
        integrationIdempotencyKeys.idempotencyKeyHash,
      ],
      set: {
        responseBody: responseBody as object,
        expiresAt,
      },
    });
}
