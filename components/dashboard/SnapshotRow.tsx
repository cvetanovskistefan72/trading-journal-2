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
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
      <Icon className="h-3 w-3" style={{ color: up ? "var(--color-chart-1)" : "var(--color-chart-2)" }} />
      {fmtPnl(Math.abs(diff))} vs last month
    </span>
  );
}

function Tile({ label, value, sub, delta }: { label: string; value: number; sub?: string; delta?: React.ReactNode }) {
  const positive = value > 0;
  const negative = value < 0;
  const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus;
  const valueColor = positive ? "var(--color-chart-1)" : negative ? "var(--color-chart-2)" : undefined;

  return (
    <div className="rounded-lg border border-border bg-card card-shadow px-5 py-4 flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{label}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/25" />
      </div>
      <div className="flex flex-col gap-1">
        <p
          className={cn("text-2xl font-bold tabular-nums leading-none truncate", !positive && !negative && "text-muted-foreground/50")}
          style={valueColor ? { color: valueColor } : undefined}
        >
          {fmtPnl(value)}
        </p>
        {delta && <div>{delta}</div>}
        {sub && <p className="text-[11px] text-muted-foreground/50">{sub}</p>}
      </div>
    </div>
  );
}

export function SnapshotRow() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card min-h-[110px] animate-pulse" />
        ))}
      </div>
    );
  }

  const todayPnl     = data?.todayPnl     ?? 0;
  const weekPnl      = data?.weekPnl      ?? 0;
  const monthPnl     = data?.monthPnl     ?? 0;
  const lastMonthPnl = data?.lastMonthPnl ?? 0;
  const allTimePnl   = data?.allTimePnl   ?? 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-4">
      <Tile label="Today"      value={todayPnl} />
      <Tile label="This Week"  value={weekPnl} />
      <Tile label="This Month" value={monthPnl} delta={<Delta current={monthPnl} previous={lastMonthPnl} />} />
      <Tile label="All Time"   value={allTimePnl} />
    </div>
  );
}
