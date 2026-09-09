"use client";

import { cn } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function fmtPnl(v: number) {
  const abs = "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (v >= 0 ? "+" : "-") + abs;
}

function Tile({ label, value, sub }: { label: string; value: number; sub?: string }) {
  const positive = value > 0;
  const negative = value < 0;
  const Icon = positive ? TrendingUp : negative ? TrendingDown : Minus;

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 flex flex-col gap-3 min-w-0 min-h-[100px]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground truncate pr-2">{label}</p>
        <Icon className={cn("h-4 w-4 shrink-0 opacity-60", positive ? "text-emerald-500" : negative ? "text-rose-400" : "text-muted-foreground")} />
      </div>
      <div>
        <p className={cn(
          "text-3xl font-bold tabular-nums leading-none",
          positive ? "text-emerald-500" : negative ? "text-rose-400" : "text-muted-foreground"
        )}>
          {fmtPnl(value)}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

export function SnapshotRow() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card px-5 py-4 min-h-[100px] animate-pulse" />
        ))}
      </div>
    );
  }

  const todayPnl = data?.todayPnl ?? 0;
  const weekPnl = data?.weekPnl ?? 0;
  const monthPnl = data?.monthPnl ?? 0;
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
      />
      <Tile label="All Time" value={allTimePnl} />
    </div>
  );
}
