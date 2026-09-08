"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import { Flame, TrendingDown, Trophy, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function StreakCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex-1 rounded-xl border border-border bg-background p-4 flex flex-col gap-3">
      <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", bg)}>
        <Icon className={cn("h-4.5 w-4.5", color)} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-bold tabular-nums mt-0.5", color)}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function StreakStats() {
  const { data, isLoading } = useAnalytics();
  const streaks = data?.streaks;

  const currentVal = streaks?.current ?? 0;
  const isWinStreak = currentVal > 0;
  const isLossStreak = currentVal < 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Streak Tracker</p>

      {isLoading ? (
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 rounded-xl border border-border bg-background p-4 space-y-3 animate-pulse">
              <div className="w-9 h-9 rounded-lg bg-muted" />
              <div className="space-y-1">
                <div className="h-2.5 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !streaks || (streaks.bestWin === 0 && streaks.bestLoss === 0) ? (
        <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">No decided trades yet</div>
      ) : (
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <StreakCard
            icon={isWinStreak ? Flame : isLossStreak ? TrendingDown : Flame}
            label="Current Streak"
            value={currentVal === 0 ? "—" : `${Math.abs(currentVal)} ${isWinStreak ? "W" : "L"}`}
            sub={isWinStreak ? "Win streak" : isLossStreak ? "Loss streak" : "No active streak"}
            color={isWinStreak ? "text-emerald-500" : isLossStreak ? "text-rose-400" : "text-muted-foreground"}
            bg={isWinStreak ? "bg-emerald-500/10" : isLossStreak ? "bg-rose-500/10" : "bg-muted"}
          />
          <StreakCard
            icon={Trophy}
            label="Best Win Streak"
            value={streaks.bestWin > 0 ? `${streaks.bestWin} W` : "—"}
            sub="All-time best"
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <StreakCard
            icon={AlertTriangle}
            label="Worst Loss Streak"
            value={streaks.bestLoss > 0 ? `${streaks.bestLoss} L` : "—"}
            sub="All-time worst"
            color="text-rose-400"
            bg="bg-rose-500/10"
          />
        </div>
      )}
    </div>
  );
}
