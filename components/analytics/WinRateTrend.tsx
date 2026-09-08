"use client";

import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { WinRatePoint } from "@/hooks/useAnalytics";

const WINDOW = 20;

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function WinRateTooltip({ active, payload }: { active?: boolean; payload?: { payload: WinRatePoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const wr = d.winRate;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>Trade #{d.tradeIndex}</p>
      <p style={{ color: "var(--color-muted-foreground)", fontSize: 11 }}>
        {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>
      <p>
        Rolling Win Rate:{" "}
        <strong style={{ color: wr >= 50 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
          {wr.toFixed(1)}%
        </strong>
      </p>
    </div>
  );
}

export function WinRateTrend() {
  const { data, isLoading } = useAnalytics();
  const trend = data?.winRateTrend ?? [];

  const last = trend[trend.length - 1];
  const isUp = (last?.winRate ?? 0) >= 50;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Win Rate Trend</p>
          {last && (
            <p className={["text-2xl font-bold tabular-nums mt-1", isUp ? "text-emerald-500" : "text-rose-400"].join(" ")}>
              {last.winRate.toFixed(1)}%
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Rolling {WINDOW}-trade window</p>
          {trend.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">{trend[trend.length - 1].tradeIndex} Trades total</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : trend.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
          Need at least {WINDOW} decided trades
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="winRateGradUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="winRateGradDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="tradeIndex"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `#${v}`}
              minTickGap={40}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <ReferenceLine
              y={50}
              stroke="var(--color-border)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              label={{ value: "50%", position: "insideTopRight", fontSize: 10, fill: "var(--color-muted-foreground)" }}
            />
            <Tooltip content={<WinRateTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="winRate"
              stroke={isUp ? "var(--color-chart-1)" : "var(--color-chart-2)"}
              strokeWidth={2}
              fill={isUp ? "url(#winRateGradUp)" : "url(#winRateGradDown)"}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
