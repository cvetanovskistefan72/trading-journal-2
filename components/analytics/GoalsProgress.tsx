"use client";

import { useGoals } from "@/hooks/useGoals";
import { useDashboard } from "@/hooks/useDashboard";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

type Status = "achieved" | "on_track" | "at_risk" | "breached";

function getStatus(pct: number, invert = false): Status {
  const p = invert ? 100 - pct : pct;
  if (p >= 100) return invert ? "breached" : "achieved";
  if (p >= 70) return invert ? "at_risk" : "on_track";
  return invert ? "on_track" : "at_risk";
}

const STATUS_LABEL: Record<Status, string> = {
  achieved: "Achieved",
  on_track: "On track",
  at_risk: "At risk",
  breached: "Breached",
};

const STATUS_COLOR: Record<Status, string> = {
  achieved: "text-[var(--color-chart-1)] bg-[color-mix(in_oklch,var(--color-chart-1)_12%,transparent)]",
  on_track: "text-[var(--color-chart-1)] bg-[color-mix(in_oklch,var(--color-chart-1)_12%,transparent)]",
  at_risk: "text-[var(--color-chart-3)] bg-[color-mix(in_oklch,var(--color-chart-3)_12%,transparent)]",
  breached: "text-[var(--color-chart-2)] bg-[color-mix(in_oklch,var(--color-chart-2)_12%,transparent)]",
};

const BAR_COLOR: Record<Status, string> = {
  achieved: "var(--color-chart-1)",
  on_track: "var(--color-chart-1)",
  at_risk: "var(--color-chart-3)",
  breached: "var(--color-chart-2)",
};

function GoalRow({ label, currentLabel, targetLabel, pct, status }: {
  label: string; currentLabel: string; targetLabel: string;
  pct: number; status: Status;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums text-muted-foreground text-xs">{currentLabel} / {targetLabel}</span>
          <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", STATUS_COLOR[status])}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: BAR_COLOR[status] }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">{pct.toFixed(0)}% of goal</p>
    </div>
  );
}

export function GoalsProgress() {
  const { data: goals } = useGoals();
  const { data: dash } = useDashboard();
  const { data: analytics } = useAnalytics();

  if (!goals || goals.length === 0) return null;

  const weekPnl = dash?.weekPnl ?? 0;
  const monthPnl = dash?.monthPnl ?? 0;
  const yearPnl = dash?.yearPnl ?? 0;
  const weekWinRate = dash?.weekWinRate ?? 0;
  const monthWinRate = dash?.monthWinRate ?? 0;
  const weekTrades = dash?.weekTrades ?? 0;
  const monthTrades = dash?.monthTrades ?? 0;
  const yearTrades = dash?.yearTrades ?? 0;
  const currentDrawdown = analytics?.drawdown?.length
    ? Math.abs(analytics.drawdown[analytics.drawdown.length - 1].drawdown)
    : 0;

  const byType = Object.fromEntries(goals.map((g) => [g.type, g.value]));

  const rows: React.ReactNode[] = [];

  if (byType.WEEKLY_PROFIT != null) {
    const pct = Math.max(0, Math.min((weekPnl / byType.WEEKLY_PROFIT) * 100, 100));
    rows.push(<GoalRow key="wpnl" label="Weekly Profit Target"
      currentLabel={`$${weekPnl.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
      targetLabel={`$${byType.WEEKLY_PROFIT.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
      pct={pct} status={getStatus(pct)} />);
  }

  if (byType.MONTHLY_PROFIT != null) {
    const pct = Math.max(0, Math.min((monthPnl / byType.MONTHLY_PROFIT) * 100, 100));
    rows.push(<GoalRow key="mpnl" label="Monthly Profit Target"
      currentLabel={`$${monthPnl.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
      targetLabel={`$${byType.MONTHLY_PROFIT.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
      pct={pct} status={getStatus(pct)} />);
  }

  if (byType.YEARLY_PROFIT != null) {
    const pct = Math.max(0, Math.min((yearPnl / byType.YEARLY_PROFIT) * 100, 100));
    rows.push(<GoalRow key="ypnl" label="Yearly Profit Target"
      currentLabel={`$${yearPnl.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
      targetLabel={`$${byType.YEARLY_PROFIT.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
      pct={pct} status={getStatus(pct)} />);
  }

  if (byType.WIN_RATE != null) {
    const pct = Math.max(0, Math.min((monthWinRate / byType.WIN_RATE) * 100, 100));
    rows.push(<GoalRow key="wr" label="Win Rate Target"
      currentLabel={`${monthWinRate.toFixed(1)}%`}
      targetLabel={`${byType.WIN_RATE}%`}
      pct={pct} status={getStatus(pct)} />);
  }

  if (byType.WEEKLY_TRADE_COUNT != null) {
    const pct = Math.min((weekTrades / byType.WEEKLY_TRADE_COUNT) * 100, 100);
    rows.push(<GoalRow key="wtc" label="Weekly Trade Count"
      currentLabel={String(weekTrades)}
      targetLabel={`${byType.WEEKLY_TRADE_COUNT} trades`}
      pct={pct} status={getStatus(pct)} />);
  }

  if (byType.MONTHLY_TRADE_COUNT != null) {
    const pct = Math.min((monthTrades / byType.MONTHLY_TRADE_COUNT) * 100, 100);
    rows.push(<GoalRow key="mtc" label="Monthly Trade Count"
      currentLabel={String(monthTrades)}
      targetLabel={`${byType.MONTHLY_TRADE_COUNT} trades`}
      pct={pct} status={getStatus(pct)} />);
  }

  if (byType.MAX_DRAWDOWN != null) {
    const pct = Math.min((currentDrawdown / byType.MAX_DRAWDOWN) * 100, 100);
    rows.push(<GoalRow key="dd" label="Max Drawdown Limit"
      currentLabel={`${currentDrawdown.toFixed(1)}%`}
      targetLabel={`${byType.MAX_DRAWDOWN}%`}
      pct={pct} status={getStatus(pct, true)} />);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Goals</p>
        <a href="/goals" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Edit goals →</a>
      </div>
      {rows}
    </div>
  );
}
