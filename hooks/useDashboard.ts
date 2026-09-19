"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/services/dashboard.service";

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
  yearPnl: number;
  lastMonthPnl: number;
  lastMonthTrades: number;
  allTimePnl: number;
  weekTrades: number;
  monthTrades: number;
  yearTrades: number;
  weekWinRate: number | null;
  monthWinRate: number | null;
  streak: number;
  streakType: "win" | "loss" | null;
  miniHeatmap: MiniHeatmapCell[];
  recentTrades: RecentTrade[];
};

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 0,
  });
}
