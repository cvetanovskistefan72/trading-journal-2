"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GoalType } from "@prisma/client";
import { getGoals, upsertGoal, deleteGoal } from "@/services/goals.service";

export type Goal = {
  id: string;
  type: GoalType;
  value: number;
};

export function useGoals() {
  return useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: getGoals,
    staleTime: 60_000,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, value }: { type: GoalType; value: number }) => upsertGoal(type, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (type: GoalType) => deleteGoal(type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
