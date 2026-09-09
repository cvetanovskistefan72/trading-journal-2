"use client";

import { cn } from "@/lib/utils";
import { useDashboard } from "@/hooks/useDashboard";
import { AlertTriangle, CheckCircle2, TrendingDown, Zap } from "lucide-react";

export function DisciplineBanner() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return null;

  const streak = data?.streak ?? 0;
  const streakType = data?.streakType;
  const weekTrades = data?.weekTrades ?? 0;
  const monthTrades = data?.monthTrades ?? 0;

  // Loss streak ≥ 3 — highest priority warning
  if (streakType === "loss" && streak >= 3) {
    return (
      <div className={cn(
        "rounded-2xl border px-5 py-4 flex items-start gap-3",
        "border-rose-500/30 bg-rose-500/5"
      )}>
        <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-rose-400">
            {streak}-loss streak — consider stepping back
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review your last {streak} trades before continuing. Emotional trading after consecutive losses increases risk.
          </p>
        </div>
      </div>
    );
  }

  // Overtrading — more than 25 trades in a week is unusually high
  if (weekTrades >= 25) {
    return (
      <div className={cn(
        "rounded-2xl border px-5 py-4 flex items-start gap-3",
        "border-amber-500/30 bg-amber-500/5"
      )}>
        <Zap className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-400">
            High trade volume this week ({weekTrades} trades)
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You&apos;ve logged significantly more trades than usual. Make sure each setup meets your criteria.
          </p>
        </div>
      </div>
    );
  }

  // Win streak ≥ 3 — positive reinforcement
  if (streakType === "win" && streak >= 3) {
    return (
      <div className={cn(
        "rounded-2xl border px-5 py-4 flex items-start gap-3",
        "border-emerald-500/30 bg-emerald-500/5"
      )}>
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-500">
            {streak}-win streak — great trading!
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Keep following your process. Don&apos;t increase size or deviate from your plan during a hot streak.
          </p>
        </div>
      </div>
    );
  }

  // Quiet week — no trades at all and month has some history
  if (weekTrades === 0 && monthTrades > 0) {
    return (
      <div className={cn(
        "rounded-2xl border px-5 py-4 flex items-start gap-3",
        "border-border bg-muted/20"
      )}>
        <TrendingDown className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">No trades logged this week</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Patience is part of the process — only trade when your setup is there.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
