"use client";

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { PnlHistBucket } from "@/hooks/useAnalytics";

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function HistTooltip({ active, payload }: { active?: boolean; payload?: { payload: PnlHistBucket }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const next = d.bucket + 100;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>
        ${d.bucket} to ${next}
      </p>
      <p>Trades: <strong>{d.count}</strong></p>
      <p>
        <span style={{ color: "var(--color-chart-1)" }}>{d.wins}W</span>
        {" / "}
        <span style={{ color: "var(--color-chart-2)" }}>{d.losses}L</span>
      </p>
    </div>
  );
}

export function PnlDistribution() {
  const { data, isLoading } = useAnalytics();
  const hist = data?.pnlDistribution ?? [];
  const hasTrades = hist.some((b) => b.count > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">P&L Distribution</p>
        <p className="text-xs text-muted-foreground mt-0.5">Trade count per $100 bucket</p>
      </div>

      {isLoading ? (
        <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : !hasTrades ? (
        <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No trades yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={hist} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={16} barCategoryGap="10%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="bucket"
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={false} tickLine={false}
              minTickGap={32}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false} tickLine={false}
              width={28}
            />
            <ReferenceLine x={0} stroke="var(--color-border)" strokeWidth={1.5} />
            <Tooltip content={<HistTooltip />} cursor={{ fill: "var(--color-border)", opacity: 0.3 }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {hist.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.bucket >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)"}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
