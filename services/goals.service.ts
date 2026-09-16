import axiosInstance from "@/lib/axios";
import type { GoalType } from "@prisma/client";
import type { Goal } from "@/hooks/useGoals";

export async function getGoals(): Promise<Goal[]> {
  const { data } = await axiosInstance.get<Goal[]>("/api/user/goals");
  return data;
}

export async function upsertGoal(type: GoalType, value: number): Promise<Goal> {
  const { data } = await axiosInstance.post<Goal>("/api/user/goals", { type, value });
  return data;
}

export async function deleteGoal(type: GoalType): Promise<void> {
  await axiosInstance.delete("/api/user/goals", { data: { type } });
}
