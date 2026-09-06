import axiosInstance from "@/lib/axios";
import type { Strategy, CreateStrategyInput, UpdateStrategyInput } from "@/types/strategy";

export async function getStrategies(): Promise<Strategy[]> {
  const { data } = await axiosInstance.get<Strategy[]>("/api/strategies");
  return data;
}

export async function getStrategy(id: string): Promise<Strategy> {
  const { data } = await axiosInstance.get<Strategy>(`/api/strategies/${id}`);
  return data;
}

export async function createStrategy(input: CreateStrategyInput): Promise<Strategy> {
  const { data } = await axiosInstance.post<Strategy>("/api/strategies", input);
  return data;
}

export async function updateStrategy(id: string, input: UpdateStrategyInput): Promise<Strategy> {
  const { data } = await axiosInstance.patch<Strategy>(`/api/strategies/${id}`, input);
  return data;
}

export async function deleteStrategy(id: string): Promise<void> {
  await axiosInstance.delete(`/api/strategies/${id}`);
}
