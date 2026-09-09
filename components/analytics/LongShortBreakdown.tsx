"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import type { DirectionBucket } from "@/hooks/useAnalytics";
import { TrendingUp, TrendingDown } from "lucide-react";

function fmtUsd(v: number) {
  const abs = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (v >= 0 ? "+" : "-") + "$" + abs;
}

function DirectionCard({ bucket }: { bucket: DirectionBucket }) {
  const isLong = bucket.direction === "long";
  const positive = bucket.pnl >= 0;
  const Icon = isLong ? TrendingUp : TrendingDown;

  return (
    <div className="flex-1 rounded-xl border border-border bg-background p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ backgroundColor: `color-mix(in oklch, var(--chart-${isLong ? 4 : 5}) 10%, transparent)` }}
          >
            <Icon className="h-4 w-4" style={{ color: `var(--color-chart-${isLong ? 4 : 5})` }} />
          </div>
          <span className="text-sm font-semibold capitalize">{bucket.direction}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{bucket.trades} Trades</span>
      </div>

      {/* P&L */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Net P&L</p>
        <p className="text-2xl font-bold tabular-nums" style={{ color: positive ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
          {fmtUsd(bucket.pnl)}
        </p>
      </div>

      {/* Win rate bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Win rate</span>
          <span className="font-semibold tabular-nums">{bucket.winRate.toFixed(1)}%</span>
        </div>
        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(bucket.winRate, 100)}%`, backgroundColor: "var(--color-chart-1)" }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span className="font-medium" style={{ color: "var(--color-chart-1)" }}>{bucket.wins}W</span>
          <span className="font-medium" style={{ color: "var(--color-chart-2)" }}>{bucket.losses}L</span>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Avg R</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: bucket.avgR >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
            {bucket.avgR >= 0 ? "+" : ""}{bucket.avgR.toFixed(2)}R
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Profit Factor</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: (bucket.profitFactor ?? 0) >= 1 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
            {bucket.profitFactor == null ? "—" : bucket.profitFactor >= 999 ? "∞" : bucket.profitFactor.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LongShortBreakdown() {
  const { data, isLoading } = useAnalytics();
  const longShort = data?.longShort ?? [];
  const hasTrades = longShort.some((d) => d.trades > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Long vs Short</p>

      {isLoading ? (
        <div className="flex gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex-1 rounded-xl border border-border bg-background p-5 space-y-4 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted" />
                <div className="h-4 w-12 bg-muted rounded" />
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
      ) : !hasTrades ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No trades yet</div>
      ) : (
        <div className="flex gap-4">
          {longShort.map((bucket) => (
            <DirectionCard key={bucket.direction} bucket={bucket} />
          ))}
        </div>
      )}
    </div>
  );
}
