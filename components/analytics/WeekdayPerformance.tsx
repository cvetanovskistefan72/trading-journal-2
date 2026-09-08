"use client";

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { DayBucket } from "@/hooks/useAnalytics";

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function DayTooltip({ active, payload }: { active?: boolean; payload?: { payload: DayBucket }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{d.day}</p>
      <p>P&L: <strong style={{ color: d.pnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(d.pnl)}</strong></p>
      <p><span style={{ color: "var(--color-chart-1)" }}>{d.wins}W</span> / <span style={{ color: "var(--color-chart-2)" }}>{d.losses}L</span> · {d.trades} Trades</p>
    </div>
  );
}

export function WeekdayPerformance() {
  const { data, isLoading } = useAnalytics();
  const days = data?.byWeekday ?? [];
  const hasTrades = days.some((d) => d.trades > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">P&L by Day of Week</p>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : !hasTrades ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No trades yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={192}>
          <BarChart data={days} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtUsd}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} />
            <Tooltip content={<DayTooltip />} cursor={{ fill: "var(--color-border)", opacity: 0.3 }} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {days.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.pnl > 0 ? "var(--color-chart-1)" : entry.pnl < 0 ? "var(--color-chart-2)" : "var(--color-chart-3)"}
                  fillOpacity={entry.trades === 0 ? 0.15 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
