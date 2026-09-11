import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { b2 } from "@/lib/b2";

const bucket = process.env.B2_BUCKET_NAME;

if (!bucket) {
  throw new Error("B2_BUCKET_NAME is not configured");
}

export async function createImageUploadUrl(objectKey: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: "image/webp",
  });

  return getSignedUrl(b2, command, {
    expiresIn: 300,
  });
}

export async function createImagePreviewUrl(
  objectKey: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  return getSignedUrl(b2, command, {
    expiresIn: 3600,
  });
}

export async function deleteImageObject(objectKey: string): Promise<void> {
  await b2.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );
}

export function createImageKeys(folder: string) {
  const id = crypto.randomUUID();

  return {
    imageKey: `${folder}/${id}.webp`,
    thumbnailKey: `${folder}/${id}-thumb.webp`,
  };
}
