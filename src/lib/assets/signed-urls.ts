import {
  isR2Configured,
  isR2StorageBucket,
  isSupabaseStorageBucket,
} from "@/lib/storage/provider";
import {
  createR2SignedReadUrl,
  createR2SignedUploadUrl,
} from "@/lib/storage/r2-storage";
import {
  createSupabaseSignedReadUrl,
  createSupabaseSignedUploadUrl,
} from "@/lib/storage/supabase-storage";

export type SignedUploadResult = {
  signedUrl: string;
  path: string;
  token: string;
};

export async function createSignedReadUrl(
  bucket: string,
  objectKey: string
): Promise<string | null> {
  if (isR2StorageBucket(bucket)) {
    return createR2SignedReadUrl(objectKey);
  }
  if (isSupabaseStorageBucket(bucket)) {
    return createSupabaseSignedReadUrl(bucket, objectKey);
  }
  return null;
}

export type SignedUploadOptions = {
  contentType?: string;
};

/**
 * ブラウザから `signedUrl` へ `PUT` するアップロード用。
 * R2 設定時は R2、未設定時は Supabase Storage。
 */
export async function createSignedUploadToStorage(
  bucket: string,
  objectKey: string,
  options?: SignedUploadOptions
): Promise<SignedUploadResult | null> {
  const contentType = options?.contentType?.trim() || "application/octet-stream";

  if (isR2Configured() && isR2StorageBucket(bucket)) {
    const r2 = await createR2SignedUploadUrl(objectKey, contentType);
    if (!r2) {
      return null;
    }
    return { signedUrl: r2.signedUrl, path: r2.path, token: "" };
  }

  if (isSupabaseStorageBucket(bucket)) {
    const supabase = await createSupabaseSignedUploadUrl(bucket, objectKey);
    if (!supabase) {
      return null;
    }
    return {
      signedUrl: supabase.signedUrl,
      path: supabase.path,
      token: supabase.token,
    };
  }

  return null;
}

export { getStorageBucket } from "@/lib/storage/config";
