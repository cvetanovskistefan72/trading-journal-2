"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function TiltTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { winRate: number; trades: number } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const { winRate, trades } = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{label}</p>
      <p>Avg P&L: <strong style={{ color: v >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(v)}</strong></p>
      <p>Win Rate: <strong>{winRate}%</strong></p>
      <p>Trades: <strong>{trades}</strong></p>
    </div>
  );
}

export function TiltMeter() {
  const { data, isLoading } = useAnalytics();
  const tilt = data?.tiltMeter ?? [];
  const hasData = tilt.some((b) => b.trades > 0);

  // Detect tilt: compare "After 0 losses" baseline vs "After 3+ losses"
  const baseline = tilt.find((b) => b.label === "After 0 losses");
  const worst = tilt.find((b) => b.label === "After 3+ losses");
  const tiltDrop = baseline && worst && worst.trades > 0
    ? worst.avgPnl - baseline.avgPnl
    : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tilt Meter</p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg P&L based on how many losses preceded the trade</p>
        </div>
        {tiltDrop !== null && (
          <div className="text-right shrink-0">
            <p className={`text-lg font-bold tabular-nums ${tiltDrop < 0 ? "text-rose-400" : "text-emerald-500"}`}>
              {fmtUsd(tiltDrop)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tilt impact</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : !hasData ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Not enough data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={tilt} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={56} />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="4 4" />
            <Tooltip content={<TiltTooltip />} cursor={{ fill: "var(--color-border)", opacity: 0.2 }} />
            <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {tilt.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.avgPnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)"}
                  opacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Win rate pills */}
      {hasData && (
        <div className="grid grid-cols-4 gap-2">
          {tilt.map((b) => (
            <div key={b.label} className="rounded-xl bg-muted/40 px-2 py-2 text-center">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold leading-tight">{b.label.replace("After ", "")}</p>
              <p className="text-sm font-bold tabular-nums mt-1">{b.winRate}%</p>
              <p className="text-[9px] text-muted-foreground">{b.trades}T</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
