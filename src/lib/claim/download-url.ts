/** 受取画面から同一オリジンでファイルを保存する URL（CORS を回避） */
export function claimDownloadUrl(claimToken: string, fileId: string): string {
  return `/api/claim/${encodeURIComponent(claimToken)}/download?fileId=${encodeURIComponent(fileId)}`;
}
