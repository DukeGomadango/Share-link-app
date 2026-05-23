import { and, eq, isNotNull, lt } from "drizzle-orm";

import { getDb } from "@/db";
import { assets } from "@/db/schema";
import { deleteStorageObject } from "@/lib/storage/delete-object";

const BATCH_SIZE = 200;

export type PurgeExpiredResult = {
  scanned: number;
  deleted: number;
  storageErrors: number;
};

/** `expires_at` を過ぎたアセットをストレージと DB から削除 */
export async function purgeExpiredAssets(): Promise<PurgeExpiredResult> {
  const db = getDb();
  const now = new Date();

  const expired = await db
    .select({
      id: assets.id,
      bucket: assets.bucket,
      objectKey: assets.objectKey,
    })
    .from(assets)
    .where(and(isNotNull(assets.expiresAt), lt(assets.expiresAt, now)))
    .limit(BATCH_SIZE);

  let deleted = 0;
  let storageErrors = 0;

  for (const row of expired) {
    const ok = await deleteStorageObject(row.bucket, row.objectKey);
    if (!ok) {
      storageErrors += 1;
    }
    await db.delete(assets).where(eq(assets.id, row.id));
    deleted += 1;
  }

  return {
    scanned: expired.length,
    deleted,
    storageErrors,
  };
}
