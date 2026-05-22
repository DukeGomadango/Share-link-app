import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const DEFAULT_STORAGE_BUCKET = "assets";

/** R2 用の必須環境変数が揃っているか */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim()
  );
}

export function getR2BucketName(): string {
  const name = process.env.R2_BUCKET_NAME?.trim();
  if (!name) {
    throw new Error("R2_BUCKET_NAME が未設定です");
  }
  return name;
}

/** 既存アセット（Supabase Storage 時代）のバケット名 */
export function getSupabaseStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_STORAGE_BUCKET;
}

/** 新規アップロード先。R2 設定時は R2、未設定時は Supabase */
export function getStorageBucket(): string {
  if (isR2Configured()) {
    return getR2BucketName();
  }
  return getSupabaseStorageBucket();
}

export function isSupabaseStorageConfigured(): boolean {
  return getSupabaseAdmin() !== null;
}

export function isStorageConfigured(): boolean {
  return isR2Configured() || isSupabaseStorageConfigured();
}

export function isR2StorageBucket(bucket: string): boolean {
  return isR2Configured() && bucket === getR2BucketName();
}

export function isSupabaseStorageBucket(bucket: string): boolean {
  return bucket === getSupabaseStorageBucket();
}
