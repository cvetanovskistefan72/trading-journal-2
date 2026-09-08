"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

type HoldTimeBucket = {
  label: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  pnl: number;
  avgPnl: number;
  avgR: number;
};

function fmtUsd(v: number) {
  const abs = Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return (v >= 0 ? "+" : "-") + "$" + abs;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: HoldTimeBucket }[];
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "12px",
        color: "var(--color-foreground)",
        lineHeight: "1.6",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.label}</p>
      <p>Avg P&L: <strong style={{ color: d.avgPnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(d.avgPnl)}</strong></p>
      <p>Win rate: <strong style={{ color: "var(--color-chart-1)" }}>{d.winRate}%</strong></p>
      <p>Trades: <strong>{d.trades}</strong> (<span style={{ color: "var(--color-chart-1)" }}>{d.wins}W</span> / <span style={{ color: "var(--color-chart-2)" }}>{d.losses}L</span>)</p>
      <p>Avg R: <strong style={{ color: d.avgR >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{d.avgR > 0 ? "+" : ""}{d.avgR}R</strong></p>
    </div>
  );
}

export function HoldTimeChart() {
  const { data = [], isLoading } = useQuery<HoldTimeBucket[]>({
    queryKey: ["analytics", "hold-time"],
    queryFn: () => fetch("/api/analytics/hold-time").then((r) => r.json()),
    staleTime: 60_000,
  });

  const hasTrades = data.some((d) => d.trades > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Avg P&L by Hold Time
      </p>

      {isLoading ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : !hasTrades ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
          No trades yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barSize={40}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtUsd}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avgPnl" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.avgPnl >= 0
                      ? "var(--color-chart-1)"
                      : "var(--color-chart-2)"
                  }
                  fillOpacity={entry.trades === 0 ? 0.15 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {hasTrades && (
        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-border">
          {data.map((b) => (
            <div key={b.label} className="flex flex-col gap-0.5 text-center">
              <span className="text-xs font-bold text-foreground">{b.label}</span>
              <span className="text-[11px] text-muted-foreground">
                {b.trades} trade{b.trades !== 1 ? "s" : ""}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {b.winRate}% WR
              </span>
              <span
                className="text-[11px] font-medium"
                style={{
                  color:
                    b.avgPnl > 0
                      ? "var(--color-chart-1)"
                      : b.avgPnl < 0
                      ? "var(--color-chart-2)"
                      : "var(--color-muted-foreground)",
                }}
              >
                {fmtUsd(b.avgPnl)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
