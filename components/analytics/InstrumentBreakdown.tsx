"use client";

import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { InstrumentBucket } from "@/hooks/useAnalytics";

function fmtPnl(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toFixed(2);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: InstrumentBucket }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "var(--color-card)", border: "1px solid var(--color-border)",
      borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
      padding: "8px 12px", lineHeight: "1.8",
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.instrument}</p>
      <p>Total P&L: <span style={{ color: d.pnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtPnl(d.pnl)}</span></p>
      <p>Win Rate: <strong style={{ color: "var(--color-chart-1)" }}>{d.winRate.toFixed(1)}%</strong></p>
      <p><span style={{ color: "var(--color-chart-1)" }}>{d.wins}W</span> / <span style={{ color: "var(--color-chart-2)" }}>{d.losses}L</span> · {d.trades} Trades</p>
    </div>
  );
}

export function InstrumentBreakdown() {
  const { data, isLoading } = useAnalytics();
  const instruments = data?.byInstrument ?? [];
  const chartHeight = Math.max(200, instruments.length * 48);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        P&amp;L by Instrument
      </p>

      {isLoading ? (
        <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : instruments.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No trades yet</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={instruments}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => "$" + v}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="instrument"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <ReferenceLine x={0} stroke="var(--color-border)" strokeWidth={1.5} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-border)", opacity: 0.3 }} />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                {instruments.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)"} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="overflow-x-auto">
            <table className="w-full text-xs tabular-nums">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-1.5 pr-4 font-medium">Instrument</th>
                  <th className="text-right py-1.5 px-3 font-medium">Trades</th>
                  <th className="text-right py-1.5 px-3 font-medium">Win Rate</th>
                  <th className="text-right py-1.5 px-3 font-medium">Avg R</th>
                  <th className="text-right py-1.5 pl-3 font-medium">P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {instruments.map((row) => (
                  <tr key={row.instrument} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="py-1.5 pr-4 font-medium">{row.instrument}</td>
                    <td className="text-right py-1.5 px-3 text-muted-foreground">{row.trades}</td>
                    <td className="text-right py-1.5 px-3 text-muted-foreground">{row.winRate.toFixed(1)}%</td>
                    <td className="text-right py-1.5 px-3" style={{ color: row.avgR > 0 ? "var(--color-chart-1)" : row.avgR < 0 ? "var(--color-chart-2)" : undefined }}>
                      {row.avgR >= 0 ? "+" : ""}{row.avgR.toFixed(2)}R
                    </td>
                    <td className="text-right py-1.5 pl-3 font-medium" style={{ color: row.pnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
                      {fmtPnl(row.pnl)}
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
