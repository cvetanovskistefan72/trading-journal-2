"use client";

import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";

type Summary = {
  total: number; wins: number; losses: number; winRate: number;
  totalPnl: number; profitFactor: number; avgWin: number; avgLoss: number; avgR: number;
};

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={cn("text-lg font-bold tabular-nums", color)}>{value}</span>
    </div>
  );
}

export function SummaryStats() {
  const { data, isLoading } = useQuery<Summary>({
    queryKey: ["analytics", "summary"],
    queryFn: () => fetch("/api/analytics/summary").then((r) => r.json()),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 h-56 flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 h-56 flex items-center justify-center text-sm text-muted-foreground">
        No trades yet
      </div>
    );
  }

  const breakeven = data.total - data.wins - data.losses;
  const pieData = [
    { name: "Wins", value: data.wins, color: "var(--color-chart-1)" },
    { name: "Losses", value: data.losses, color: "var(--color-chart-2)" },
    ...(breakeven > 0 ? [{ name: "Breakeven", value: breakeven, color: "var(--color-chart-3)" }] : []),
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Performance Summary</p>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0 w-40 h-40">
          <PieChart width={160} height={160} style={{ position: "absolute", top: 0, left: 0 }}>
            <Pie
              data={pieData}
              cx={80} cy={80}
              innerRadius={52} outerRadius={72}
              startAngle={90} endAngle={-270}
              dataKey="value"
              strokeWidth={0}
              isAnimationActive={false}
            >
              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold tabular-nums leading-none">{data.winRate.toFixed(0)}%</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest leading-none">win rate</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-4">
          <StatBox label="Total Trades" value={String(data.total)} />
          <StatBox label="Profit Factor" value={
            data.profitFactor === Infinity ? "∞" : data.profitFactor.toFixed(2)
          } color={data.profitFactor >= 1 ? "text-emerald-500" : "text-rose-400"} />
          <StatBox label="Avg Win" value={fmtUsd(data.avgWin)} color="text-emerald-500" />
          <StatBox label="Avg Loss" value={fmtUsd(-data.avgLoss)} color="text-rose-400" />
          <StatBox label="Avg R" value={`${data.avgR >= 0 ? "+" : ""}${data.avgR.toFixed(2)}R`}
            color={data.avgR >= 0 ? "text-emerald-500" : "text-rose-400"} />
          <StatBox label="Net P&L" value={fmtUsd(data.totalPnl)}
            color={data.totalPnl >= 0 ? "text-emerald-500" : "text-rose-400"} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        {pieData.map((p) => (
          <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            {p.name} ({p.value})
          </div>
        ))}
      </div>
    </div>
  );
}
