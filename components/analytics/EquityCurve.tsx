"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PeriodFilter, fromDate, type PeriodPreset } from "@/components/analytics/PeriodFilter";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function EquityTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{label ? fmtDate(label) : ""}</p>
      <p>Cumulative P&L: <strong style={{ color: v >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(v)}</strong></p>
    </div>
  );
}

export function EquityCurve() {
  const [preset, setPreset] = useState<PeriodPreset>("ALL");
  const from = fromDate(preset);
  const { data, isLoading } = useAnalytics(from);
  const equity = data?.equity ?? [];

  const last = equity[equity.length - 1];
  const isUp = (last?.cumulative ?? 0) >= 0;
  const color = isUp ? "var(--color-chart-1)" : "var(--color-chart-2)";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Equity Curve</p>
          {last && (
            <p className={cn("text-2xl font-bold tabular-nums mt-1", isUp ? "text-emerald-500" : "text-rose-400")}>
              {fmtUsd(last.cumulative)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <PeriodFilter value={preset} onChange={setPreset} />
          {last && (isUp
            ? <TrendingUp className="h-5 w-5 text-emerald-500" />
            : <TrendingDown className="h-5 w-5 text-rose-400" />
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : equity.length < 2 ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Not enough data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={equity} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={40} />
            <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={56} />
            <Tooltip content={<EquityTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }} />
            <Area type="monotoneX" dataKey="cumulative" stroke={color} strokeWidth={2} fill="url(#equityGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
