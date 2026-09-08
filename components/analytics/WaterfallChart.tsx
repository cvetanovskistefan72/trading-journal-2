"use client";

import { useMemo } from "react";
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function WaterfallTooltip({ active, payload }: { active?: boolean; payload?: { payload: { tradeIndex: number; date: string; pnl: number; end: number } }[] }) {
  if (!active || !payload?.length) return null;
  const { tradeIndex, date, pnl, end } = payload[0].payload;
  const d = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>Trade #{tradeIndex} · {d}</p>
      <p>P&L: <strong style={{ color: pnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(pnl)}</strong></p>
      <p>Running total: <strong>{fmtUsd(end)}</strong></p>
    </div>
  );
}

export function WaterfallChart() {
  const { data, isLoading } = useAnalytics();
  const raw = data?.waterfall ?? [];

  // Recharts waterfall trick: invisible base bar + colored delta bar stacked
  const chartData = useMemo(() => raw.map((b) => ({
    ...b,
    base: Math.min(b.start, b.end),
    delta: Math.abs(b.pnl),
  })), [raw]);

  const hasData = raw.length >= 2;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Waterfall</p>
        <p className="text-xs text-muted-foreground mt-0.5">Individual trade P&L contribution to cumulative</p>
      </div>

      {isLoading ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : !hasData ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Not enough data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="10%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="tradeIndex"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={20}
              label={{ value: "Trade #", position: "insideBottomRight", offset: -4, fontSize: 10, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="4 4" />
            <Tooltip content={<WaterfallTooltip />} cursor={{ fill: "var(--color-border)", opacity: 0.2 }} />
            {/* Invisible base to offset the bar */}
            <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
            {/* Visible delta bar colored by result */}
            <Bar dataKey="delta" stackId="wf" radius={[2, 2, 0, 0]} isAnimationActive={false}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.result === "win" ? "var(--color-chart-1)" : entry.result === "loss" ? "var(--color-chart-2)" : "oklch(0.828 0.189 84.429)"}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
