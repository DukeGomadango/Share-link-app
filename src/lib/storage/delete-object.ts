import { isR2StorageBucket } from "@/lib/storage/provider";
import { deleteR2Object } from "@/lib/storage/r2-storage";

/** DB に記録された bucket / objectKey に応じて R2 から削除 */
export async function deleteStorageObject(
  bucket: string,
  objectKey: string
): Promise<boolean> {
  if (!isR2StorageBucket(bucket)) {
    console.error("Unsupported storage bucket (R2 only):", bucket);
    return false;
  }
  return deleteR2Object(objectKey);
}
