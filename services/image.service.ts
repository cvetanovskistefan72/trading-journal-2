import axiosInstance from "@/lib/axios";
import imageCompression from "browser-image-compression";

import type { ImageUploadOptions } from "@/types/image";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];

export async function compressImage(
  file: File,
  options: ImageUploadOptions = {},
): Promise<File> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Only JPG and PNG images are allowed.");
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: options.maxSizeMB ?? 2,
    maxWidthOrHeight: options.maxWidthOrHeight ?? 2560,
    initialQuality: options.initialQuality ?? 0.95,
    useWebWorker: true,
    fileType: "image/webp",
  });

  return new File([compressed], `${crypto.randomUUID()}.webp`, {
    type: "image/webp",
  });
}

export async function createThumbnail(file: File): Promise<File> {
  const thumbnail = await imageCompression(file, {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 450,
    initialQuality: 0.8,
    useWebWorker: true,
    fileType: "image/webp",
  });

  return new File([thumbnail], `${crypto.randomUUID()}-thumb.webp`, {
    type: "image/webp",
  });
}

export async function uploadImageToUrl(
  file: File,
  uploadUrl: string,
): Promise<void> {
  await axiosInstance.put(uploadUrl, file, {
    headers: {
      "Content-Type": "image/webp",
    },
  });
}
