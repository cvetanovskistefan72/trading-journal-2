"use client";

import { cn } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";

function fmtPnl(v: number) {
  const abs = "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (v >= 0 ? "+" : "-") + abs;
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (previous === 0 && diff === 0) return null;
  const up = diff >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
      style={{ color: up ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
      <Icon className="h-3 w-3" />
      {fmtPnl(Math.abs(diff))} vs last month
    </span>
  );
}

function Tile({ label, value, sub, delta }: { label: string; value: number; sub?: string; delta?: React.ReactNode }) {
  const positive = value > 0;
  const negative = value < 0;
  const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus;

  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-3 sm:px-5 sm:py-4 flex flex-col gap-2 sm:gap-3 min-w-0 min-h-[90px]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground truncate pr-2">{label}</p>
        <Icon
          className="h-4 w-4 shrink-0 opacity-60"
          style={{ color: positive ? "var(--color-chart-1)" : negative ? "var(--color-chart-2)" : undefined }}
        />
      </div>
      <div>
        <p
          className={cn("text-lg sm:text-2xl lg:text-3xl font-bold tabular-nums leading-none truncate", !positive && !negative && "text-muted-foreground")}
          style={positive ? { color: "var(--color-chart-1)" } : negative ? { color: "var(--color-chart-2)" } : undefined}
        >
          {fmtPnl(value)}
        </p>
        {delta && <div className="mt-1">{delta}</div>}
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function SnapshotRow() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card px-5 py-4 min-h-[100px] animate-pulse" />
        ))}
      </div>
    );
  }

  const todayPnl = data?.todayPnl ?? 0;
  const weekPnl = data?.weekPnl ?? 0;
  const monthPnl = data?.monthPnl ?? 0;
  const lastMonthPnl = data?.lastMonthPnl ?? 0;
  const allTimePnl = data?.allTimePnl ?? 0;
  const weekTrades = data?.weekTrades ?? 0;
  const monthTrades = data?.monthTrades ?? 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Tile label="Today" value={todayPnl} />
      <Tile
        label="This Week"
        value={weekPnl}
        sub={weekTrades > 0 ? `${weekTrades} trade${weekTrades !== 1 ? "s" : ""}` : "No trades yet"}
      />
      <Tile
        label="This Month"
        value={monthPnl}
        sub={monthTrades > 0 ? `${monthTrades} trade${monthTrades !== 1 ? "s" : ""}` : "No trades yet"}
        delta={<Delta current={monthPnl} previous={lastMonthPnl} />}
      />
      <Tile label="All Time" value={allTimePnl} />
    </div>
  );
}
