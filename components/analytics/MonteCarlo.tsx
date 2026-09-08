"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";

function fmtUsd(v: number) {
  if (v === undefined || v === null) return "—";
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function MCTooltip({ active, payload }: { active?: boolean; payload?: { payload: { tradeIndex: number; p10: number; p50: number; p90: number } }[] }) {
  if (!active || !payload?.length) return null;
  const { tradeIndex, p10, p50, p90 } = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>Trade #{tradeIndex}</p>
      <p>Best case (90th %): <strong style={{ color: "var(--color-chart-1)" }}>{fmtUsd(p90)}</strong></p>
      <p>Median (50th %): <strong>{fmtUsd(p50)}</strong></p>
      <p>Worst case (10th %): <strong style={{ color: "var(--color-chart-2)" }}>{fmtUsd(p10)}</strong></p>
    </div>
  );
}

export function MonteCarlo() {
  const { data, isLoading } = useAnalytics();
  const curve = data?.monteCarlo ?? [];
  const stats = data?.monteCarloStats;
  const hasData = curve.length >= 2;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Monte Carlo Simulation</p>
          <p className="text-xs text-muted-foreground mt-0.5">1,000 random shuffles of your trade history</p>
        </div>
        {stats && (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold tabular-nums text-emerald-500">{stats.probProfit}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Prob. Profit</p>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Worst DD (95th)</p>
            <p className="text-sm font-bold text-rose-400 tabular-nums mt-0.5">-{fmtUsd(stats.worstDD).replace("+", "").replace("-", "")}</p>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">10th % Final</p>
            <p className="text-sm font-bold tabular-nums mt-0.5" style={{ color: stats.p10Final >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(stats.p10Final)}</p>
          </div>
          <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">90th % Final</p>
            <p className="text-sm font-bold tabular-nums mt-0.5 text-emerald-500">{fmtUsd(stats.p90Final)}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : !hasData ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Not enough data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={curve} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mcBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="mcMid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="tradeIndex" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={30} />
            <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={56} />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeDasharray="4 4" />
            <Tooltip content={<MCTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }} />
            {/* Outer band p10–p90 */}
            <Area type="monotone" dataKey="p90" stroke="none" fill="url(#mcBand)" fillOpacity={1} dot={false} legendType="none" />
            <Area type="monotone" dataKey="p10" stroke="none" fill="var(--color-card)" fillOpacity={1} dot={false} legendType="none" />
            {/* Inner band p25–p75 */}
            <Area type="monotone" dataKey="p75" stroke="none" fill="url(#mcMid)" fillOpacity={1} dot={false} legendType="none" />
            <Area type="monotone" dataKey="p25" stroke="none" fill="var(--color-card)" fillOpacity={1} dot={false} legendType="none" />
            {/* Median line */}
            <Area type="monotone" dataKey="p50" stroke="var(--color-chart-1)" strokeWidth={2} fill="none" dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center gap-4 text-[10px] text-muted-foreground justify-center">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm bg-emerald-500/15 border border-emerald-500/30" />p10–p90 range</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm bg-emerald-500/30" />p25–p75 range</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 bg-emerald-500" />Median</span>
      </div>
    </div>
  );
}
