"use client";

import { useGoals } from "@/hooks/useGoals";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";
import type { GoalType } from "@prisma/client";

type Status = "achieved" | "on_track" | "at_risk" | "breached";

function getStatus(pct: number, invert = false): Status {
  const p = invert ? 100 - pct : pct;
  if (p >= 100) return invert ? "breached" : "achieved";
  if (p >= 70)  return invert ? "at_risk"  : "on_track";
  return invert ? "on_track" : "at_risk";
}

const STATUS_LABEL: Record<Status, string> = {
  achieved: "Achieved",
  on_track: "On track",
  at_risk:  "At risk",
  breached: "Breached",
};

const STATUS_COLOR: Record<Status, string> = {
  achieved: "text-[var(--color-chart-1)] bg-[color-mix(in_oklch,var(--color-chart-1)_12%,transparent)]",
  on_track: "text-[var(--color-chart-1)] bg-[color-mix(in_oklch,var(--color-chart-1)_12%,transparent)]",
  at_risk:  "text-[var(--color-chart-3)] bg-[color-mix(in_oklch,var(--color-chart-3)_12%,transparent)]",
  breached: "text-[var(--color-chart-2)] bg-[color-mix(in_oklch,var(--color-chart-2)_12%,transparent)]",
};

const BAR_COLOR: Record<Status, string> = {
  achieved: "var(--color-chart-1)",
  on_track: "var(--color-chart-1)",
  at_risk:  "var(--color-chart-3)",
  breached: "var(--color-chart-2)",
};

const GOAL_LABEL: Record<GoalType, string> = {
  WEEKLY_PROFIT:       "Weekly Profit Target",
  MONTHLY_PROFIT:      "Monthly Profit Target",
  YEARLY_PROFIT:       "Yearly Profit Target",
  WIN_RATE:            "Win Rate Target",
  WEEKLY_TRADE_COUNT:  "Weekly Trade Count",
  MONTHLY_TRADE_COUNT: "Monthly Trade Count",
  MAX_DRAWDOWN:        "Max Drawdown Limit",
};

const INVERT: Partial<Record<GoalType, boolean>> = { MAX_DRAWDOWN: true };

function formatCurrent(type: GoalType, current: number): string {
  if (type === "WEEKLY_PROFIT" || type === "MONTHLY_PROFIT" || type === "YEARLY_PROFIT")
    return `$${current.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (type === "WIN_RATE" || type === "MAX_DRAWDOWN")
    return `${current.toFixed(1)}%`;
  return String(current);
}

function formatTarget(type: GoalType, value: number): string {
  if (type === "WEEKLY_PROFIT" || type === "MONTHLY_PROFIT" || type === "YEARLY_PROFIT")
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (type === "WIN_RATE" || type === "MAX_DRAWDOWN")
    return `${value}%`;
  return `${value} trades`;
}

function GoalRow({ type, current, value }: { type: GoalType; current: number; value: number }) {
  const pct = Math.max(0, Math.min((current / value) * 100, 100));
  const status = getStatus(pct, INVERT[type]);

  return (
    <div className="rounded-lg border border-border bg-card card-shadow p-5 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{GOAL_LABEL[type]}</span>
        <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", STATUS_COLOR[status])}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: BAR_COLOR[status] }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{pct.toFixed(0)}% of goal</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatCurrent(type, current)} / {formatTarget(type, value)}
        </p>
      </div>
    </div>
  );
}

export default function GoalsProgressPage() {
  const { data: goals, isLoading } = useGoals();

  if (isLoading) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-6">
        <div className="space-y-1">
          <div className="h-7 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map(i => <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />)}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Goals Progress</h1>
        <p className="text-sm text-muted-foreground">Track how you are performing against your targets.</p>
      </div>

      {!goals || goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 rounded-lg border border-dashed border-border">
          <Target className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No goals configured</p>
          <p className="text-xs text-muted-foreground">Go to Set Goals to add your first target.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((g) => (
            <GoalRow key={g.type} type={g.type} current={g.current} value={g.value} />
          ))}
        </div>
      )}
    </main>
  );
}
