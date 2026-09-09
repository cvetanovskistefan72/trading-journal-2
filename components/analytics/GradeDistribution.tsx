"use client";

import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { GradeBucket } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function GradeTooltip({ active, payload }: { active?: boolean; payload?: { payload: GradeBucket }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>Grade {d.grade}</p>
      <p>Trades: <strong>{d.trades}</strong> (<span style={{ color: "var(--color-chart-1)" }}>{d.wins}W</span> / <span style={{ color: "var(--color-chart-2)" }}>{d.losses}L</span>)</p>
      <p>Win Rate: <strong style={{ color: d.winRate >= 50 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{d.winRate.toFixed(1)}%</strong></p>
      <p>Avg P&L: <strong style={{ color: d.avgPnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(d.avgPnl)}</strong></p>
      <p>Avg R: <strong style={{ color: d.avgR >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{d.avgR >= 0 ? "+" : ""}{d.avgR.toFixed(2)}R</strong></p>
    </div>
  );
}

const ALL_GRADES = ["B", "B+", "A-", "A", "A+", "A+++"];

const EMPTY_GRADE = (grade: string): GradeBucket => ({
  grade, trades: 0, wins: 0, losses: 0, winRate: 0, pnl: 0, avgPnl: 0, avgR: 0,
});

export function GradeDistribution() {
  const { data, isLoading } = useAnalytics();
  const raw = data?.byGrade ?? [];

  const grades = ALL_GRADES.map((g) => raw.find((r) => r.grade === g) ?? EMPTY_GRADE(g));

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Avg P&L by Grade</p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-8 rounded bg-muted/40 animate-pulse" />)}
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grades} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="grade"
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtUsd}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} />
              <Tooltip content={<GradeTooltip />} cursor={{ fill: "var(--color-border)", opacity: 0.3 }} />
              <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]}>
                {grades.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.avgPnl === 0 ? "var(--color-muted-foreground)" : entry.avgPnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)"}
                    fillOpacity={entry.avgPnl === 0 ? 0.2 : 0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="overflow-x-auto border-t border-border pt-3">
            <table className="w-full text-xs tabular-nums">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-1 pr-4 font-medium">Grade</th>
                  <th className="text-right py-1 px-3 font-medium">Trades</th>
                  <th className="text-right py-1 px-3 font-medium">Win Rate</th>
                  <th className="text-right py-1 px-3 font-medium">Avg R</th>
                  <th className="text-right py-1 pl-3 font-medium">Avg P&L</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((row) => (
                  <tr key={row.grade} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="py-1 pr-4 font-semibold">{row.grade}</td>
                    <td className="text-right py-1 px-3 text-muted-foreground">{row.trades}</td>
                    <td className={cn("text-right py-1 px-3 font-medium", row.wins + row.losses === 0 ? "text-muted-foreground" : row.winRate >= 50 ? "text-emerald-500" : "text-rose-400")}>
                      {row.wins + row.losses === 0 ? "—" : `${row.winRate.toFixed(1)}%`}
                    </td>
                    <td className="text-right py-1 px-3" style={{ color: row.avgR > 0 ? "var(--color-chart-1)" : row.avgR < 0 ? "var(--color-chart-2)" : undefined }}>
                      {row.avgR === 0 ? <span className="text-muted-foreground">—</span> : `${row.avgR >= 0 ? "+" : ""}${row.avgR.toFixed(2)}R`}
                    </td>
                    <td className="text-right py-1 pl-3 font-medium" style={{ color: row.avgPnl > 0 ? "var(--color-chart-1)" : row.avgPnl < 0 ? "var(--color-chart-2)" : undefined }}>
                      {row.avgPnl === 0 ? <span className="text-muted-foreground">—</span> : fmtUsd(row.avgPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
