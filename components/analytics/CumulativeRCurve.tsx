"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/useAnalytics";

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function RTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: { tradeIndex: number; date: string } }[] }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const { tradeIndex, date } = payload[0].payload;
  const d = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>Trade #{tradeIndex} · {d}</p>
      <p>Cumulative R: <strong style={{ color: v >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{v >= 0 ? "+" : ""}{v.toFixed(2)}R</strong></p>
    </div>
  );
}

export function CumulativeRCurve() {
  const { data, isLoading } = useAnalytics();
  const curve = data?.cumulativeRCurve ?? [];

  const last = curve[curve.length - 1];
  const isUp = (last?.cumulativeR ?? 0) >= 0;

  const values = curve.map((p) => p.cumulativeR);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 0);
  const range = maxVal - minVal || 1;
  const zeroOffset = `${Math.round((maxVal / range) * 100)}%`;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cumulative R Curve</p>
          {last && (
            <p className={cn("text-2xl font-bold tabular-nums mt-1", isUp ? "text-emerald-500" : "text-rose-400")}>
              {isUp ? "+" : ""}{last.cumulativeR.toFixed(2)}R
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">Running sum of R-multiples across all trades</p>
        </div>
        {last && (isUp
          ? <TrendingUp className="h-5 w-5 text-emerald-500" />
          : <TrendingDown className="h-5 w-5 text-rose-400" />
        )}
      </div>

      {isLoading ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : curve.length < 2 ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Not enough data yet (need trades with risk set)</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={curve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rCurveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
                <stop offset={zeroOffset} stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                <stop offset={zeroOffset} stopColor="var(--color-chart-2)" stopOpacity={0.05} />
                <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="rCurveStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" />
                <stop offset={zeroOffset} stopColor="var(--color-chart-1)" />
                <stop offset={zeroOffset} stopColor="var(--color-chart-2)" />
                <stop offset="100%" stopColor="var(--color-chart-2)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="tradeIndex"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
              label={{ value: "Trade #", position: "insideBottomRight", offset: -4, fontSize: 10, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              tickFormatter={(v) => `${v}R`}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="4 4" />
            <Tooltip content={<RTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }} />
            <Area
              type="monotoneX"
              dataKey="cumulativeR"
              stroke="url(#rCurveStroke)"
              strokeWidth={2}
              fill="url(#rCurveGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
