import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client } from "@/lib/storage/r2-client";
import { getR2BucketName } from "@/lib/storage/provider";
import {
  SIGNED_READ_EXPIRY_SECONDS,
  SIGNED_UPLOAD_EXPIRY_SECONDS,
} from "@/lib/storage/config";

export async function createR2SignedReadUrl(
  objectKey: string,
  expiresIn: number = SIGNED_READ_EXPIRY_SECONDS
): Promise<string | null> {
  const client = getR2Client();
  if (!client) {
    return null;
  }
  try {
    return await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: getR2BucketName(),
        Key: objectKey,
      }),
      { expiresIn }
    );
  } catch (e) {
    console.error("R2 signed read URL failed:", e);
    return null;
  }
}

export async function createR2SignedUploadUrl(
  objectKey: string,
  contentType: string
): Promise<{ signedUrl: string; path: string } | null> {
  const client = getR2Client();
  if (!client) {
    return null;
  }
  try {
    const signedUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: getR2BucketName(),
        Key: objectKey,
        ContentType: contentType,
      }),
      { expiresIn: SIGNED_UPLOAD_EXPIRY_SECONDS }
    );
    return { signedUrl, path: objectKey };
  } catch (e) {
    console.error("R2 signed upload URL failed:", e);
    return null;
  }
}

export type R2ObjectBody = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength?: number;
};

/** サーバー側で R2 オブジェクトを読み出す（受取ダウンロードプロキシ用） */
export async function readR2Object(
  objectKey: string
): Promise<R2ObjectBody | null> {
  const client = getR2Client();
  if (!client) {
    return null;
  }
  try {
    const out = await client.send(
      new GetObjectCommand({
        Bucket: getR2BucketName(),
        Key: objectKey,
      })
    );
    if (!out.Body) {
      return null;
    }
    const body = out.Body.transformToWebStream() as ReadableStream<Uint8Array>;
    return {
      body,
      contentType: out.ContentType ?? "application/octet-stream",
      contentLength: out.ContentLength,
    };
  } catch (e) {
    console.error("R2 read object failed:", e);
    return null;
  }
}

export async function deleteR2Object(objectKey: string): Promise<boolean> {
  const client = getR2Client();
  if (!client) {
    return false;
  }
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: getR2BucketName(),
        Key: objectKey,
      })
    );
    return true;
  } catch (e) {
    console.error("R2 delete failed:", e);
    return false;
  }
}
