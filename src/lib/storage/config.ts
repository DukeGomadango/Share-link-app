export {
  DEFAULT_STORAGE_BUCKET,
  getStorageBucket,
  getSupabaseStorageBucket,
  getR2BucketName,
  isR2Configured,
  isR2StorageBucket,
  isStorageConfigured,
  isSupabaseStorageBucket,
  isSupabaseStorageConfigured,
} from "@/lib/storage/provider";

/** 1 ファイルあたりの上限（バイト） */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** ライブラリ一覧・受取用の署名付き GET の秒数 (1週間) */
export const SIGNED_READ_EXPIRY_SECONDS = 604800;

/** ブラウザ直 PUT 用の署名付きアップロード URL の秒数 */
export const SIGNED_UPLOAD_EXPIRY_SECONDS = 3600;
