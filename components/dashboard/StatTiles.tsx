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
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  iconColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 flex flex-col gap-3 min-w-0 min-h-[100px]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground truncate pr-2">{label}</p>
        <Icon className={cn("h-4 w-4 shrink-0 opacity-60", iconColor ?? "text-muted-foreground")} />
      </div>
      <div>
        <p className={cn("text-3xl font-bold tabular-nums leading-none", valueColor ?? "text-foreground")}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
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
        <div className="h-8 w-40 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-card px-5 py-4 min-h-[100px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const streak = data?.streak ?? 0;
  const streakType = data?.streakType;

  const winRate = period === "month" ? data?.monthWinRate : data?.weekWinRate;
  const trades = period === "month" ? data?.monthTrades ?? 0 : data?.weekTrades ?? 0;
  const lastMonthTrades = data?.lastMonthTrades ?? 0;
  const weekTrades = data?.weekTrades ?? 0;
  const monthTrades = data?.monthTrades ?? 0;

  const streakColor = streakType === "win" ? "text-[var(--color-chart-1)]" : streakType === "loss" ? "text-[var(--color-chart-2)]" : "text-muted-foreground/40";
  const streakIconColor = streakType === "win" ? "text-[var(--color-chart-1)]" : streakType === "loss" ? "text-[var(--color-chart-2)]" : "text-muted-foreground";
  const streakLabel = streakType === "loss" ? "Loss Streak" : "Win Streak";
  const streakValue = streak > 0 ? `${streak}${streakType === "win" ? "W" : streakType === "loss" ? "L" : ""}` : "—";

  const wrColor = winRate == null ? undefined : winRate >= 50 ? "text-[var(--color-chart-1)]" : "text-[var(--color-chart-2)]";
  const wrIconColor = winRate == null ? undefined : winRate >= 50 ? "text-[var(--color-chart-1)]" : "text-[var(--color-chart-2)]";

  // This month vs last month comparison for trades
  const tradesDiff = monthTrades - lastMonthTrades;
  const tradesSub = period === "month"
    ? lastMonthTrades > 0
      ? `${tradesDiff >= 0 ? "+" : ""}${tradesDiff} vs last month`
      : `${monthTrades} trade${monthTrades !== 1 ? "s" : ""}`
    : `${weekTrades} trade${weekTrades !== 1 ? "s" : ""} this week`;

  return (
    <div className="space-y-3">
      {/* Period toggle */}
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Key Stats</p>
        <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs font-medium ml-auto">
          {(["month", "week"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 transition-colors cursor-pointer",
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {p === "month" ? "This Month" : "This Week"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Tile
          icon={Target}
          label={`Win Rate · ${period === "month" ? "Month" : "Week"}`}
          value={winRate != null ? `${winRate}%` : "—"}
          sub={trades > 0 ? `${trades} decided trade${trades !== 1 ? "s" : ""}` : "No trades yet"}
          valueColor={wrColor}
          iconColor={wrIconColor}
        />
        <Tile
          icon={Flame}
          label={streakLabel}
          value={streakValue}
          valueColor={streakColor}
          iconColor={streakIconColor}
        />
        <Tile
          icon={BarChart2}
          label="Trades · This Week"
          value={weekTrades > 0 ? `${weekTrades}` : "—"}
          sub={weekTrades > 0 ? "logged this week" : "No trades yet"}
        />
        <Tile
          icon={Calendar}
          label="Trades · This Month"
          value={monthTrades > 0 ? `${monthTrades}` : "—"}
          sub={tradesSub}
        />
      </div>
    </div>
  );
}
