"use client";

import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { ConfluenceBucket } from "@/hooks/useAnalytics";

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function ConfTooltip({ active, payload }: { active?: boolean; payload?: { payload: ConfluenceBucket }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{d.confluence}</p>
      <p>Trades: <strong>{d.trades}</strong> (<span style={{ color: "var(--color-chart-1)" }}>{d.wins}W</span> / <span style={{ color: "var(--color-chart-2)" }}>{d.losses}L</span>)</p>
      <p>Win Rate: <strong style={{ color: d.winRate >= 50 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{d.winRate.toFixed(1)}%</strong></p>
      <p>Avg R: <strong style={{ color: d.avgR >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{d.avgR >= 0 ? "+" : ""}{d.avgR.toFixed(2)}R</strong></p>
    </div>
  );
}

export function ConfluencePerformance() {
  const { data, isLoading } = useAnalytics();
  const confluences = data?.byConfluence ?? [];
  const chartHeight = Math.max(220, confluences.length * 44);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Confluence Performance</p>
        <p className="text-xs text-muted-foreground mt-0.5">Avg R per confluence tag, sorted best to worst</p>
      </div>

      {isLoading ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : confluences.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No confluence data yet</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={confluences}
              layout="vertical"
              margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
              barSize={18}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <YAxis
                dataKey="confluence"
                type="category"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false} tickLine={false}
                width={120}
              />
              <XAxis
                type="number"
                tickFormatter={(v) => `${v}R`}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false} tickLine={false}
              />
              <ReferenceLine x={0} stroke="var(--color-border)" strokeWidth={1.5} />
              <Tooltip content={<ConfTooltip />} cursor={{ fill: "var(--color-border)", opacity: 0.3 }} />
              <Bar dataKey="avgR" radius={[0, 4, 4, 0]}>
                {confluences.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.avgR >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)"}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="overflow-x-auto">
            <table className="w-full text-xs tabular-nums">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-1.5 pr-4 font-medium">Confluence</th>
                  <th className="text-right py-1.5 px-3 font-medium">Trades</th>
                  <th className="text-right py-1.5 px-3 font-medium">Win Rate</th>
                  <th className="text-right py-1.5 px-3 font-medium">Avg R</th>
                  <th className="text-right py-1.5 pl-3 font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {confluences.map((row) => (
                  <tr key={row.confluence} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="py-1.5 pr-4 font-medium truncate max-w-[160px]">{row.confluence}</td>
                    <td className="text-right py-1.5 px-3 text-muted-foreground">{row.trades}</td>
                    <td className="text-right py-1.5 px-3" style={{ color: row.winRate >= 50 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
                      {row.winRate.toFixed(1)}%
                    </td>
                    <td className="text-right py-1.5 px-3 font-medium" style={{ color: row.avgR >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
                      {row.avgR >= 0 ? "+" : ""}{row.avgR.toFixed(2)}R
                    </td>
                    <td className="text-right py-1.5 pl-3" style={{ color: row.pnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
                      {row.pnl >= 0 ? "+" : "-"}${Math.abs(row.pnl).toFixed(2)}
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
