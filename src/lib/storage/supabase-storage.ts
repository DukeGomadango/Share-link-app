import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { SIGNED_READ_EXPIRY_SECONDS } from "@/lib/storage/config";

export async function createSupabaseSignedReadUrl(
  bucket: string,
  objectKey: string,
  expiresIn: number = SIGNED_READ_EXPIRY_SECONDS
): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return null;
  }
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(objectKey, expiresIn);
  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}

export async function createSupabaseSignedUploadUrl(
  bucket: string,
  objectKey: string
): Promise<{ signedUrl: string; path: string; token: string } | null> {
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

export async function deleteSupabaseObject(
  bucket: string,
  objectKey: string
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return false;
  }
  const { error } = await admin.storage.from(bucket).remove([objectKey]);
  if (error) {
    console.error("Supabase storage delete failed:", error);
    return false;
  }
  return true;
}
