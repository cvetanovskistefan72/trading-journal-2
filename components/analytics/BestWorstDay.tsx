"use client";

import type { AnalyticsData, DayAvg } from "@/hooks/useAnalytics";
import { TrendingUp, TrendingDown } from "lucide-react";

function fmtUsd(v: number) {
  const abs = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (v >= 0 ? "+" : "-") + "$" + abs;
}

function DayCard({ day, type }: { day: DayAvg; type: "best" | "worst" }) {
  const isBest = type === "best";
  const positive = day.avgPnl >= 0;
  const Icon = isBest ? TrendingUp : TrendingDown;
  const chartVar = isBest ? 4 : 5;

  return (
    <div className="flex-1 rounded-lg border border-border bg-sidebar p-5 flex flex-col justify-center space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ backgroundColor: `color-mix(in oklch, var(--chart-${chartVar}) 10%, transparent)` }}
          >
            <Icon className="h-4 w-4" style={{ color: `var(--color-chart-${chartVar})` }} />
          </div>
          <span className="text-sm font-semibold">{isBest ? "Best Day" : "Worst Day"}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{day.tradingDays} Sessions</span>
      </div>

      {/* Day name + avg P&L */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Avg P&L · {day.day}</p>
        <p className="text-2xl font-bold tabular-nums" style={{ color: positive ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
          {fmtUsd(day.avgPnl)}
        </p>
      </div>

      {/* Visual bar — how far from zero */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Avg per session</span>
          <span className="font-semibold tabular-nums" style={{ color: positive ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
            {fmtUsd(day.avgPnl)}
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(Math.abs(day.avgPnl) / 5, 100)}%`,
              backgroundColor: positive ? "var(--color-chart-1)" : "var(--color-chart-2)",
            }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">{day.tradingDays} trading {day.tradingDays === 1 ? "day" : "days"} sampled</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Day</p>
          <p className="text-base font-bold tabular-nums">{day.day}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Sessions</p>
          <p className="text-base font-bold tabular-nums">{day.tradingDays}</p>
        </div>
      </div>
    </div>
  );
}

export function BestWorstDay({ data, isLoading }: { data: AnalyticsData | undefined; isLoading: boolean }) {
  const { bestDay, worstDay } = data ?? {};

  return (
    <div className="rounded-lg border border-border bg-card card-shadow p-6 flex flex-col gap-4 justify-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Best &amp; Worst Trading Day</p>

      {isLoading ? (
        <div className="flex gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex-1 rounded-lg border border-border bg-sidebar p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
              <div className="h-8 w-24 bg-muted rounded" />
              <div className="space-y-1.5">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-2 bg-muted rounded-full w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : !bestDay || !worstDay ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Not enough data</div>
      ) : (
        <div className="flex-1 flex items-center">
          <div className="flex gap-4 w-full">
            <DayCard day={bestDay} type="best" />
            <DayCard day={worstDay} type="worst" />
          </div>
        </div>
      )}
    </div>
  );
}
