import axiosInstance from "@/lib/axios";
import { TradeImage } from "@/types/image";
import type {
  Trade,
  CreateTradeInput,
  TradesParams,
  TradesResponse,
} from "@/types/trade";
import {
  compressImage,
  createThumbnail,
  uploadImageToUrl,
} from "./image.service";

export async function getTrades(
  params: TradesParams = {},
): Promise<TradesResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  if (params.search) query.set("search", params.search);
  if (params.strategyId) query.set("strategyId", params.strategyId);
  if (params.archived !== undefined)
    query.set("archived", String(params.archived));

  const { data } = await axiosInstance.get<TradesResponse>(
    `/api/trades?${query.toString()}`,
  );
  return data;
}

export async function createTrade(input: CreateTradeInput): Promise<Trade> {
  const { data } = await axiosInstance.post<Trade>("/api/trades", input);
  return data;
}

export async function updateTrade(
  id: string,
  input: Partial<CreateTradeInput>,
): Promise<Trade> {
  const { data } = await axiosInstance.patch<Trade>(`/api/trades/${id}`, input);
  return data;
}

export async function archiveTrade(id: string): Promise<Trade> {
  const { data } = await axiosInstance.patch<Trade>(`/api/trades/${id}`, {
    archived: true,
  });
  return data;
}

export async function restoreTrade(id: string): Promise<Trade> {
  const { data } = await axiosInstance.patch<Trade>(`/api/trades/${id}`, {
    archived: false,
  });
  return data;
}

export async function deleteTrade(id: string): Promise<void> {
  await axiosInstance.delete(`/api/trades/${id}`);
}

export async function uploadTradeImage(
  tradeId: string,
  file: File,
): Promise<TradeImage> {
  const isCompressible = file.type === "image/jpeg" || file.type === "image/png";
  const [image, thumbnail] = await Promise.all([
    isCompressible ? compressImage(file) : createThumbnail(file),
    createThumbnail(file),
  ]);

  const { data: upload } = await axiosInstance.post<any>(
    `/api/trades/${tradeId}/images/upload-url`,
  );

  await Promise.all([
    uploadImageToUrl(image, upload.imageUploadUrl),

    uploadImageToUrl(thumbnail, upload.thumbnailUploadUrl),
  ]);

  const { data } = await axiosInstance.post<TradeImage>(
    `/api/trades/${tradeId}/images`,
    {
      imageKey: upload.imageKey,
      thumbnailKey: upload.thumbnailKey,
    },
  );

  return data;
}
