import { S3Client } from "@aws-sdk/client-s3";

const globalForR2 = globalThis as unknown as {
  __r2S3Client?: S3Client;
};

/** Cloudflare R2（S3 互換）クライアント。未設定時は null。 */
export function getR2Client(): S3Client | null {
  if (globalForR2.__r2S3Client) {
    return globalForR2.__r2S3Client;
  }

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  globalForR2.__r2S3Client = client;
  return client;
}
