import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { campaigns } from "@/db/schema";
import { jsonWithCors } from "@/lib/external-cors";

const PAUSED_MESSAGE =
  "このキャンペーンではだんごツール連携が一時停止されています。リンクシェア管理画面で「ツール連携を再開」してください。";

/**
 * キャンペーンで外部ツールからの書き込みが許可されているか。
 * 不可のときは 403 Response を返す（呼び出し側は `instanceof Response` で分岐）。
 */
export async function ensureCampaignToolIntegrationWritable(
  campaignId: string,
  workspaceId: string,
  request: Request
): Promise<Response | null> {
  const db = getDb();
  const [row] = await db
    .select({ isExternalLinked: campaigns.isExternalLinked })
    .from(campaigns)
    .where(
      and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId))
    )
    .limit(1);

  if (!row) {
    return jsonWithCors(
      { error: "not_found", message: "キャンペーンが見つかりません" },
      request,
      { status: 404 }
    );
  }

  if (!row.isExternalLinked) {
    return jsonWithCors(
      { error: "integration_paused", message: PAUSED_MESSAGE },
      request,
      { status: 403 }
    );
  }

  return null;
}
