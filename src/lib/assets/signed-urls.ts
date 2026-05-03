import { getStorageBucket, SIGNED_READ_EXPIRY_SECONDS } from "@/lib/storage/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function createSignedReadUrl(
  bucket: string,
  objectKey: string
): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return null;
  }
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(objectKey, SIGNED_READ_EXPIRY_SECONDS);
  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}

export type SignedUploadResult = {
  signedUrl: string;
  path: string;
  token: string;
};

/**
 * ブラウザから `signedUrl` へ `PUT` するアップロード用。
 */
export async function createSignedUploadToStorage(
  bucket: string,
  objectKey: string
): Promise<SignedUploadResult | null> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return null;
  }
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUploadUrl(objectKey, { upsert: true });
  if (error || !data) {
    return null;
  }

  let signedUrl = data.signedUrl;
  if (signedUrl.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
    if (baseUrl) {
      signedUrl = `${baseUrl}${signedUrl}`;
    }
  }

  return { signedUrl, path: data.path, token: data.token };
}

export { getStorageBucket };
