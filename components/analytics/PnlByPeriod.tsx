"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { PeriodFilter, fromDate, type PeriodPreset } from "@/components/analytics/PeriodFilter";
import { useAnalytics } from "@/hooks/useAnalytics";

type Bucket = { period: string; pnl: number; wins: number; losses: number };

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function PeriodTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: Bucket }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{label ? fmtPeriodLabel(label) : ""}</p>
      <p>P&L: <strong style={{ color: v >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(v)}</strong></p>
      <p style={{ color: "var(--color-muted-foreground)" }}><span style={{ color: "var(--color-chart-1)" }}>{d.wins}W</span> / <span style={{ color: "var(--color-chart-2)" }}>{d.losses}L</span></p>
    </div>
  );
}

function fmtPeriodLabel(period: string) {
  if (period.includes("-W")) {
    const [year, week] = period.split("-W");
    return `W${week} '${year.slice(2)}`;
  }
  const [year, month] = period.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function PnlByPeriod() {
  const [mode, setMode] = useState<"monthly" | "weekly">("monthly");
  const [preset, setPreset] = useState<PeriodPreset>("ALL");
  const from = fromDate(preset);

  const { data: analytics, isLoading } = useAnalytics(from);

  const data = useMemo<Bucket[]>(() => {
    if (!analytics?.calendarHeatmap) return [];
    const buckets = new Map<string, Bucket>();
    for (const day of analytics.calendarHeatmap) {
      let key: string;
      if (mode === "monthly") {
        key = day.date.slice(0, 7);
      } else {
        const d = new Date(day.date);
        const jan4 = new Date(d.getFullYear(), 0, 4);
        const week = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
      }
      const b = buckets.get(key) ?? { period: key, pnl: 0, wins: 0, losses: 0 };
      b.pnl = Math.round((b.pnl + day.pnl) * 100) / 100;
      b.wins += day.wins;
      b.losses += day.losses;
      buckets.set(key, b);
    }
    return Array.from(buckets.values()).sort((a, b) => a.period.localeCompare(b.period));
  }, [analytics, mode]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Net P&L by Period</p>
        <div className="flex items-center gap-2">
          <PeriodFilter value={preset} onChange={setPreset} />
          <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs font-medium">
            {(["monthly", "weekly"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-3 py-1.5 transition-colors capitalize",
                  mode === m ? "bg-primary text-primary-foreground cursor-default" : "text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                )}
              >
                {m === "monthly" ? "Monthly" : "Weekly"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No trades yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="period"
              tickFormatter={fmtPeriodLabel}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={fmtUsd}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} />
            <Tooltip content={<PeriodTooltip />} cursor={{ fill: "var(--color-border)", opacity: 0.3 }} />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.pnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)"}
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
