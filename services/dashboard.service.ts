import axiosInstance from "@/lib/axios";
import type { DashboardData } from "@/hooks/useDashboard";

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await axiosInstance.get<DashboardData>("/api/dashboard");
  return data;
}
