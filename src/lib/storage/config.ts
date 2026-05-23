export {
  getStorageBucket,
  getR2BucketName,
  isR2Configured,
  isR2StorageBucket,
  isStorageConfigured,
} from "@/lib/storage/provider";

/** 1 ファイルあたりの上限（バイト） */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** 受取・プレビューモーダル用の署名付き GET（1週間） */
export const SIGNED_READ_EXPIRY_SECONDS = 604800;

/** ライブラリサムネ用（短め・一覧での無駄なキャッシュを抑える） */
export const SIGNED_PREVIEW_EXPIRY_SECONDS = 3600;

/** ブラウザ直 PUT 用の署名付きアップロード URL の秒数 */
export const SIGNED_UPLOAD_EXPIRY_SECONDS = 3600;
