import axiosInstance from "@/lib/axios";
import type { Trade, CreateTradeInput, TradesParams, TradesResponse } from "@/types/trade";

export async function getTrades(params: TradesParams = {}): Promise<TradesResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortDir) query.set("sortDir", params.sortDir);
  if (params.search) query.set("search", params.search);
  if (params.strategyId) query.set("strategyId", params.strategyId);
  if (params.archived !== undefined) query.set("archived", String(params.archived));

  const { data } = await axiosInstance.get<TradesResponse>(`/api/trades?${query.toString()}`);
  return data;
}

export async function createTrade(input: CreateTradeInput): Promise<Trade> {
  const { data } = await axiosInstance.post<Trade>("/api/trades", input);
  return data;
}

export async function updateTrade(id: string, input: Partial<CreateTradeInput>): Promise<Trade> {
  const { data } = await axiosInstance.patch<Trade>(`/api/trades/${id}`, input);
  return data;
}

export async function archiveTrade(id: string): Promise<Trade> {
  const { data } = await axiosInstance.patch<Trade>(`/api/trades/${id}`, { archived: true });
  return data;
}

export async function restoreTrade(id: string): Promise<Trade> {
  const { data } = await axiosInstance.patch<Trade>(`/api/trades/${id}`, { archived: false });
  return data;
}

export async function deleteTrade(id: string): Promise<void> {
  await axiosInstance.delete(`/api/trades/${id}`);
}
