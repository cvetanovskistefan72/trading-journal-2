"use client";

import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, LabelList, ResponsiveContainer,
} from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { RBucket } from "@/hooks/useAnalytics";

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const tooltipStyle = {
  background: "var(--color-card)", border: "1px solid var(--color-border)",
  borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
  padding: "8px 12px", lineHeight: "1.8",
};

function RTooltip({ active, payload }: { active?: boolean; payload?: { payload: RBucket }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{d.bucket}</p>
      <p>Count: <strong>{d.count} trade{d.count !== 1 ? "s" : ""}</strong></p>
      <p>P&L: <strong style={{ color: d.pnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(d.pnl)}</strong></p>
    </div>
  );
}

function bucketColor(bucket: string): string {
  if (bucket === "0R to 1R") return "oklch(0.828 0.189 84.429)";
  if (bucket.startsWith("0") || bucket.startsWith("1") || bucket.startsWith("2") || bucket.startsWith(">")) {
    return "var(--color-chart-1)";
  }
  return "var(--color-chart-2)";
}

export function RMultipleDistribution() {
  const { data, isLoading } = useAnalytics();
  const rMultiple = data?.rMultiple ?? [];
  const hasTrades = rMultiple.some((d) => d.count > 0);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        R-Multiple Distribution
      </p>

      {isLoading ? (
        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : !hasTrades ? (
        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No trades yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={rMultiple}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 0, bottom: 4 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <YAxis
              dataKey="bucket"
              type="category"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<RTooltip />} cursor={{ fill: "var(--color-border)", opacity: 0.3 }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {rMultiple.map((entry, i) => (
                <Cell key={i} fill={bucketColor(entry.bucket)} fillOpacity={0.85} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                formatter={(v: unknown) => (Number(v) === 0 ? "" : String(v))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
