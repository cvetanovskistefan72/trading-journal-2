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

export interface TradeImage {
  id: string;
  tradeId: string;
  objectKey: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
}