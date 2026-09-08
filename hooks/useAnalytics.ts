"use client";

import { useQuery } from "@tanstack/react-query";

export type EquityPoint = { date: string; cumulative: number };
export type Summary = {
  total: number; wins: number; losses: number; winRate: number;
  totalPnl: number; profitFactor: number; avgWin: number; avgLoss: number; avgR: number;
};
export type DayBucket = { day: string; pnl: number; wins: number; losses: number; trades: number };
export type RBucket = { bucket: string; count: number; pnl: number };
export type HoldBucket = { label: string; trades: number; wins: number; losses: number; winRate: number; pnl: number; avgPnl: number; avgR: number };
export type SessionBucket = { session: string; pnl: number; trades: number; wins: number; losses: number; winRate: number; avgR: number };
export type InstrumentBucket = { instrument: string; pnl: number; trades: number; wins: number; losses: number; winRate: number; avgR: number };

export type AnalyticsData = {
  equity: EquityPoint[];
  summary: Summary;
  byWeekday: DayBucket[];
  rMultiple: RBucket[];
  holdTime: HoldBucket[];
  bySession: SessionBucket[];
  byInstrument: InstrumentBucket[];
};

export function useAnalytics(from?: string) {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics", "all", from],
    queryFn: () => fetch(`/api/analytics/all${from ? `?from=${from}` : ""}`).then((r) => r.json()),
    staleTime: 60_000,
  });
}
