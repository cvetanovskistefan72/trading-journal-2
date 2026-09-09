"use client";

import { useState } from "react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { DrawdownPoint } from "@/hooks/useAnalytics";
import { PeriodFilter, fromDate, type PeriodPreset } from "@/components/analytics/PeriodFilter";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function DrawdownTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: DrawdownPoint }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{label ? fmtDate(label) : ""}</p>
      <p>Drawdown: <strong style={{ color: "var(--color-chart-2)" }}>{d.drawdown.toFixed(2)}%</strong></p>
      <p>Equity: <strong style={{ color: d.cumulative >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
        {d.cumulative >= 0 ? "+" : ""}${d.cumulative.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </strong></p>
    </div>
  );
}

export function DrawdownChart() {
  const [preset, setPreset] = useState<PeriodPreset>("ALL");
  const from = fromDate(preset);
  const { data, isLoading } = useAnalytics(from);
  const drawdown = data?.drawdown ?? [];

  const minDd = drawdown.length > 0 ? Math.min(...drawdown.map((d) => d.drawdown)) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Drawdown</p>
          {minDd < 0 && (
            <p className="text-2xl font-bold tabular-nums mt-1 text-rose-400">
              {minDd.toFixed(2)}%
            </p>
          )}
        </div>
        <PeriodFilter value={preset} onChange={setPreset} />
      </div>

      {isLoading ? (
        <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : drawdown.length < 2 ? (
        <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">Not enough data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={drawdown} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={40} />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false} tickLine={false} width={52}
              domain={[Math.min(minDd * 1.1, -1), 0]}
            />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1} />
            <Tooltip content={<DrawdownTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }} />
            <Area
              type="monotoneX"
              dataKey="drawdown"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              fill="url(#ddGrad)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
