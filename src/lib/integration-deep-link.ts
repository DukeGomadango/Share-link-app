/** だんごツール等からキャンペーン管理画面へフォーカスするクエリ（両アプリで同名） */
export const FOCUS_EXTERNAL_TX_QUERY = "focus_external_tx";

export function campaignAdminUrlWithFocus(
  baseUrl: string,
  campaignId: string,
  externalTransactionId: string
): string {
  const u = new URL(`${baseUrl.replace(/\/$/, "")}/campaigns/${campaignId}`);
  u.searchParams.set(FOCUS_EXTERNAL_TX_QUERY, externalTransactionId);
  return u.toString();
}
