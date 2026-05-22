import {
  isR2StorageBucket,
  isSupabaseStorageBucket,
} from "@/lib/storage/provider";
import { deleteR2Object } from "@/lib/storage/r2-storage";
import { deleteSupabaseObject } from "@/lib/storage/supabase-storage";

/** DB に記録された bucket / objectKey に応じてストレージから削除 */
export async function deleteStorageObject(
  bucket: string,
  objectKey: string
): Promise<boolean> {
  if (isR2StorageBucket(bucket)) {
    return deleteR2Object(objectKey);
  }
  if (isSupabaseStorageBucket(bucket)) {
    return deleteSupabaseObject(bucket, objectKey);
  }
  console.error("Unknown storage bucket:", bucket);
  return false;
}
