/** アップロード時の Storage キー用にファイル名を単一行・パストラバーサルなしに整形する */
export function sanitizeFilenameForStorage(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, "_");
  const base = trimmed.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^a-zA-Z0-9.\-_]/gi, "_");
  const limited = cleaned.slice(0, 200);
  return limited.length > 0 ? limited : "file";
}
