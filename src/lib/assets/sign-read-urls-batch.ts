import { createSignedReadUrl } from "@/lib/assets/signed-urls";
import { SIGNED_PREVIEW_EXPIRY_SECONDS } from "@/lib/storage/config";

export type SignReadTarget = {
  key: string;
  bucket: string;
  objectKey: string;
};

/** 複数オブジェクトの署名付き GET URL を並列生成（キー → URL） */
export async function createSignedReadUrlMap(
  targets: SignReadTarget[],
  expiresInSeconds: number = SIGNED_PREVIEW_EXPIRY_SECONDS
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (targets.length === 0) {
    return map;
  }

  await Promise.all(
    targets.map(async (target) => {
      const url = await createSignedReadUrl(target.bucket, target.objectKey, {
        expiresInSeconds,
      });
      if (url) {
        map.set(target.key, url);
      }
    })
  );

  return map;
}

export function isImageMime(mime: string | null | undefined): boolean {
  return !!mime?.startsWith("image/");
}
