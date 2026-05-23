/** 保持期限バー用: 作成日〜期限日から総日数を算出 */
export function retentionTotalDays(
  createdAtIso: string,
  expiresAtIso: string
): number {
  const created = new Date(createdAtIso).getTime();
  const expires = new Date(expiresAtIso).getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.ceil((expires - created) / dayMs));
}
