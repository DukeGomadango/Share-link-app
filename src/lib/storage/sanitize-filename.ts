/** アップロード時の Storage キー用にファイル名を単一行・パストラバーサルなしに整形する */
export function sanitizeFilenameForStorage(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, "_");
  const base = trimmed.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\-()+@\u3000-\u30ff\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/gi, "_");
  const limited = cleaned.slice(0, 200);
  return limited.length > 0 ? limited : "file";
}
