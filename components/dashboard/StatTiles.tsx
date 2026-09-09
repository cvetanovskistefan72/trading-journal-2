"use client";

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

export function StatTiles() {
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

  const winRate = data?.monthWinRate;
  const streak = data?.streak ?? 0;
  const streakType = data?.streakType;
  const weekTrades = data?.weekTrades ?? 0;
  const monthTrades = data?.monthTrades ?? 0;

  const streakColor = streakType === "win" ? "text-emerald-500" : streakType === "loss" ? "text-rose-400" : "text-muted-foreground/40";
  const streakIconColor = streakType === "win" ? "text-emerald-500" : streakType === "loss" ? "text-rose-400" : "text-muted-foreground";
  const streakLabel = streakType === "loss" ? "Loss Streak" : "Win Streak";
  const streakValue = streak > 0 ? `${streak}${streakType === "win" ? "W" : streakType === "loss" ? "L" : ""}` : "—";

  const wrColor = winRate == null ? undefined : winRate >= 50 ? "text-emerald-500" : "text-rose-400";
  const wrIconColor = winRate == null ? undefined : winRate >= 50 ? "text-emerald-500" : "text-rose-400";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Tile
        icon={Target}
        label="Win Rate · Month"
        value={winRate != null ? `${winRate}%` : "—"}
        sub={monthTrades > 0 ? `${monthTrades} decided trade${monthTrades !== 1 ? "s" : ""}` : "No trades yet"}
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
        sub={weekTrades > 0 ? `logged this week` : "No trades yet"}
      />
      <Tile
        icon={Calendar}
        label="Trades · This Month"
        value={monthTrades > 0 ? `${monthTrades}` : "—"}
        sub={monthTrades > 0 ? `logged this month` : "No trades yet"}
      />
    </div>
  );
}
