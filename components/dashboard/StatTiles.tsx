"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import { Flame, Target, BarChart2, Calendar } from "lucide-react";

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  valueColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card card-shadow px-5 py-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 truncate pr-2">{label}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/25" />
      </div>
      <div className="flex flex-col gap-1">
        <p className={cn("text-2xl font-bold tabular-nums leading-none", valueColor ?? "text-foreground")}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground/50">{sub}</p>}
      </div>
    </div>
  );
}

type Period = "month" | "week";

export function StatTiles() {
  const { data, isLoading } = useDashboard();
  const [period, setPeriod] = useState<Period>("month");

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card min-h-[110px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const streak          = data?.streak         ?? 0;
  const streakType      = data?.streakType;
  const winRate         = period === "month" ? data?.monthWinRate  : data?.weekWinRate;
  const trades          = period === "month" ? data?.monthTrades   ?? 0 : data?.weekTrades ?? 0;
  const weekTrades      = data?.weekTrades      ?? 0;
  const monthTrades     = data?.monthTrades     ?? 0;
  const lastMonthTrades = data?.lastMonthTrades ?? 0;

  const streakValueColor = streakType === "win"
    ? "text-[var(--color-chart-1)]"
    : streakType === "loss"
    ? "text-[var(--color-chart-2)]"
    : "text-muted-foreground/40";
  const streakValue = streak > 0
    ? `${streak}${streakType === "win" ? "W" : streakType === "loss" ? "L" : ""}`
    : "—";
  const streakLabel = streakType === "loss" ? "Loss Streak" : "Win Streak";

  const wrValueColor = winRate == null
    ? undefined
    : winRate >= 50 ? "text-[var(--color-chart-1)]" : "text-[var(--color-chart-2)]";

  const tradesDiff = monthTrades - lastMonthTrades;
  const tradesSub = period === "month"
    ? lastMonthTrades > 0
      ? `${tradesDiff >= 0 ? "+" : ""}${tradesDiff} vs last month`
      : `${monthTrades} trade${monthTrades !== 1 ? "s" : ""}`
    : `${weekTrades} trade${weekTrades !== 1 ? "s" : ""} this week`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Key Stats</p>
        <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs font-medium ml-auto">
          {(["month", "week"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn(
              "px-3 py-1.5 transition-colors cursor-pointer",
              period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}>
              {p === "month" ? "This Month" : "This Week"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Tile icon={Target}   label={`Win Rate · ${period === "month" ? "Month" : "Week"}`}
          value={winRate != null ? `${winRate}%` : "—"}
          sub={trades > 0 ? `${trades} decided trade${trades !== 1 ? "s" : ""}` : "No trades yet"}
          valueColor={wrValueColor} />
        <Tile icon={Flame}    label={streakLabel}
          value={streakValue} valueColor={streakValueColor} />
        <Tile icon={BarChart2} label="Trades · This Week"
          value={weekTrades > 0 ? `${weekTrades}` : "—"}
          sub={weekTrades > 0 ? "logged this week" : "No trades yet"} />
        <Tile icon={Calendar} label="Trades · This Month"
          value={monthTrades > 0 ? `${monthTrades}` : "—"}
          sub={tradesSub} />
      </div>
    </div>
  );
}
