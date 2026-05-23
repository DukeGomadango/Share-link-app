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

/** 新規アップロード先（R2 のみ） */
export function getStorageBucket(): string {
  return getR2BucketName();
}

export function isStorageConfigured(): boolean {
  return isR2Configured();
}

export function isR2StorageBucket(bucket: string): boolean {
  return isR2Configured() && bucket === getR2BucketName();
}
