"use client";

import { useQuery } from "@tanstack/react-query";

export type RecentTrade = {
  id: string;
  date: string;
  instrument: string;
  direction: "long" | "short";
  pnl: number;
  result: "win" | "loss" | "breakeven";
  grade: string | null;
  strategyName: string;
};

export type MiniHeatmapCell = {
  date: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  result: "win" | "loss" | "breakeven" | null;
};

export type DashboardData = {
  todayPnl: number;
  weekPnl: number;
  monthPnl: number;
  allTimePnl: number;
  weekTrades: number;
  monthTrades: number;
  monthWinRate: number | null;
  streak: number;
  streakType: "win" | "loss" | null;
  miniHeatmap: MiniHeatmapCell[];
  recentTrades: RecentTrade[];
};

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
    staleTime: 30_000,
  });
}
