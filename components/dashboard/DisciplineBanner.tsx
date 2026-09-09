"use client";

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
      <div className="rounded-2xl border px-5 py-4 flex items-start gap-3"
        style={{
          borderColor: "color-mix(in oklch, var(--chart-2) 30%, transparent)",
          backgroundColor: "color-mix(in oklch, var(--chart-2) 5%, transparent)",
        }}
      >
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-chart-2)" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-chart-2)" }}>
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
      <div className="rounded-2xl border px-5 py-4 flex items-start gap-3"
        style={{
          borderColor: "color-mix(in oklch, var(--chart-3) 30%, transparent)",
          backgroundColor: "color-mix(in oklch, var(--chart-3) 5%, transparent)",
        }}
      >
        <Zap className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-chart-3)" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-chart-3)" }}>
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
      <div className="rounded-2xl border px-5 py-4 flex items-start gap-3"
        style={{
          borderColor: "color-mix(in oklch, var(--chart-1) 30%, transparent)",
          backgroundColor: "color-mix(in oklch, var(--chart-1) 5%, transparent)",
        }}
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--color-chart-1)" }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-chart-1)" }}>
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
      <div className="rounded-2xl border border-border bg-muted/20 px-5 py-4 flex items-start gap-3">
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
