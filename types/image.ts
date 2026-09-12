export interface ImageUploadOptions {
  compress?: boolean;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
}

export interface ImageUploadResponse {
  uploadUrl: string;
  objectKey: string;
}

export interface Image {
  id: string;
  entityType: string;
  entityId: string;
  imageKey: string;
  thumbnailKey: string;
  createdAt: string;
}
