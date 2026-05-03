export const DEFAULT_STORAGE_BUCKET = "assets";

export function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_STORAGE_BUCKET;
}

/** 1 ファイルあたりの上限（バイト） */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** ライブラリ一覧・受取用の署名付き GET の秒数 */
export const SIGNED_READ_EXPIRY_SECONDS = 3600;
