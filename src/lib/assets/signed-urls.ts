import { isR2StorageBucket } from "@/lib/storage/provider";
import {
  createR2SignedReadUrl,
  createR2SignedUploadUrl,
} from "@/lib/storage/r2-storage";

export type SignedUploadResult = {
  signedUrl: string;
  path: string;
  token: string;
};

export type SignedReadOptions = {
  expiresInSeconds?: number;
};

export async function createSignedReadUrl(
  bucket: string,
  objectKey: string,
  options?: SignedReadOptions
): Promise<string | null> {
  if (!isR2StorageBucket(bucket)) {
    console.error("Unsupported storage bucket (R2 only):", bucket);
    return null;
  }
  return createR2SignedReadUrl(objectKey, options?.expiresInSeconds);
}

export type SignedUploadOptions = {
  contentType?: string;
};

/** ブラウザから `signedUrl` へ `PUT` するアップロード用（R2 のみ） */
export async function createSignedUploadToStorage(
  bucket: string,
  objectKey: string,
  options?: SignedUploadOptions
): Promise<SignedUploadResult | null> {
  if (!isR2StorageBucket(bucket)) {
    console.error("Unsupported storage bucket (R2 only):", bucket);
    return null;
  }
  const contentType = options?.contentType?.trim() || "application/octet-stream";
  const r2 = await createR2SignedUploadUrl(objectKey, contentType);
  if (!r2) {
    return null;
  }
  return { signedUrl: r2.signedUrl, path: r2.path, token: "" };
}

export { getStorageBucket } from "@/lib/storage/config";
