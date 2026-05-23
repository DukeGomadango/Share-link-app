/** だんごツール連携の external_transaction_id プレフィックス */
export function isGachaExternalTransactionId(id: string): boolean {
  return id.startsWith("gacha-");
}
