"use client";

import { cn } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import { Flame, Target, BarChart2, Calendar } from "lucide-react";

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", color ?? "text-muted-foreground")} />
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground truncate">{label}</p>
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function StatTiles() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  const winRate = data?.monthWinRate;
  const streak = data?.streak ?? 0;
  const streakType = data?.streakType;
  const weekTrades = data?.weekTrades ?? 0;
  const monthTrades = data?.monthTrades ?? 0;

  const streakColor =
    streakType === "win" ? "text-emerald-500" : streakType === "loss" ? "text-rose-400" : "text-muted-foreground";
  const streakLabel = streakType === "win" ? "Win streak" : streakType === "loss" ? "Loss streak" : "Streak";
  const streakValue = streak > 0 ? `${streak}${streakType === "win" ? "W" : streakType === "loss" ? "L" : ""}` : "—";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Tile
        icon={Target}
        label="Win Rate (Month)"
        value={winRate !== null && winRate !== undefined ? `${winRate}%` : "—"}
        sub={monthTrades > 0 ? `${monthTrades} decided` : "No trades"}
        color={
          winRate !== null && winRate !== undefined
            ? winRate >= 50 ? "text-emerald-500" : "text-rose-400"
            : undefined
        }
      />
      <Tile
        icon={Flame}
        label={streakLabel}
        value={streakValue}
        color={streakColor}
      />
      <Tile
        icon={BarChart2}
        label="Trades This Week"
        value={weekTrades > 0 ? `${weekTrades}` : "—"}
        sub={weekTrades > 0 ? "logged" : "No trades yet"}
      />
      <Tile
        icon={Calendar}
        label="Trades This Month"
        value={monthTrades > 0 ? `${monthTrades}` : "—"}
        sub={monthTrades > 0 ? "logged" : "No trades yet"}
      />
    </div>
  );
}
