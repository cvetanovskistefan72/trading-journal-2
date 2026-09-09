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
export type DirectionBucket = { direction: "long" | "short"; pnl: number; trades: number; wins: number; losses: number; winRate: number; avgR: number; profitFactor: number };
export type WinRatePoint = { date: string; tradeIndex: number; winRate: number };
export type GradeBucket = { grade: string; trades: number; wins: number; losses: number; winRate: number; pnl: number; avgPnl: number; avgR: number };
export type Streaks = { current: number; currentType: "win" | "loss" | null; bestWin: number; bestLoss: number };
export type DrawdownPoint = { date: string; drawdown: number; cumulative: number };
export type PnlHistBucket = { bucket: number; label: string; count: number; wins: number; losses: number };
export type ConfluenceBucket = { confluence: string; trades: number; wins: number; losses: number; winRate: number; pnl: number; avgR: number };
export type CalendarDay = { date: string; pnl: number; trades: number; wins: number; losses: number };
export type TimeOfDayCell = { hour: number; day: string; avgPnl: number; trades: number; wins: number; losses: number; winRate: number };
export type CumulativeRPoint = { date: string; tradeIndex: number; cumulativeR: number };
export type TiltBucket = { label: string; trades: number; winRate: number; avgPnl: number };

export type AnalyticsData = {
  equity: EquityPoint[];
  summary: Summary;
  byWeekday: DayBucket[];
  rMultiple: RBucket[];
  holdTime: HoldBucket[];
  bySession: SessionBucket[];
  byInstrument: InstrumentBucket[];
  longShort: DirectionBucket[];
  winRateTrend: WinRatePoint[];
  byGrade: GradeBucket[];
  streaks: Streaks;
  drawdown: DrawdownPoint[];
  pnlDistribution: PnlHistBucket[];
  byConfluence: ConfluenceBucket[];
  calendarHeatmap: CalendarDay[];
  timeOfDay: TimeOfDayCell[];
  cumulativeRCurve: CumulativeRPoint[];
  tiltMeter: TiltBucket[];
};

export function useAnalytics(from?: string) {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics", "all", from],
    queryFn: () => fetch(`/api/analytics/all${from ? `?from=${from}` : ""}`).then((r) => r.json()),
    staleTime: 60_000,
  });
}
