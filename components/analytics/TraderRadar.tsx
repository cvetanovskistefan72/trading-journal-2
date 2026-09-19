"use client";

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import type { AnalyticsData } from "@/hooks/useAnalytics";

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function computeScores(data: AnalyticsData) {
  const { summary, winRateTrend } = data;

  // Win Rate: 0–100% → score 0–100
  const winRate = clamp(summary.winRate, 0, 100);

  // Profit Factor: 0 = bad, 2+ = excellent, cap at 3
  const profitFactor = clamp((summary.profitFactor / 3) * 100, 0, 100);

  // Avg Win/Loss ratio: 1 = breakeven, 3+ = excellent
  const ratio = summary.avgLoss > 0 ? summary.avgWin / summary.avgLoss : summary.avgWin > 0 ? 3 : 0;
  const avgWinLoss = clamp((ratio / 3) * 100, 0, 100);

  // Risk/Reward (avg R): -2R = 0, 0R = 33, 2R = 100 (linear mapped -2 to 3 → 0 to 100)
  const rr = clamp(((summary.avgR + 2) / 5) * 100, 0, 100);

  // Consistency: stddev of rolling win rates — lower = more consistent
  // score = 100 - (stddev / 50 * 100), capped
  let consistency = 50; // default when not enough data
  if (winRateTrend.length >= 5) {
    const rates = winRateTrend.map((p) => p.winRate);
    const mean = rates.reduce((s, v) => s + v, 0) / rates.length;
    const stddev = Math.sqrt(rates.reduce((s, v) => s + (v - mean) ** 2, 0) / rates.length);
    consistency = clamp(100 - (stddev / 50) * 100, 0, 100);
  }

  return [
    { axis: "Win Rate",      score: Math.round(winRate),      raw: `${summary.winRate.toFixed(1)}%` },
    { axis: "Profit Factor", score: Math.round(profitFactor), raw: summary.profitFactor >= 999 ? "∞" : summary.profitFactor.toFixed(2) },
    { axis: "Win/Loss Ratio",score: Math.round(avgWinLoss),   raw: summary.avgLoss > 0 ? (summary.avgWin / summary.avgLoss).toFixed(2) : "—" },
    { axis: "Risk/Reward",   score: Math.round(rr),           raw: `${summary.avgR >= 0 ? "+" : ""}${summary.avgR.toFixed(2)}R` },
    { axis: "Consistency",   score: Math.round(consistency),  raw: winRateTrend.length < 5 ? "Need more trades" : `${Math.round(consistency)}/100` },
  ];
}

function scoreColor(score: number) {
  if (score >= 70) return "var(--color-chart-1)";
  if (score >= 40) return "var(--color-chart-3)";
  return "var(--color-chart-2)";
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: { axis: string; score: number; raw: string } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "var(--color-card)", border: "1px solid var(--color-border)",
      borderRadius: "8px", fontSize: "12px", color: "var(--color-foreground)",
      padding: "8px 12px", lineHeight: "1.8",
    }}>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{d.axis}</p>
      <p>Score: <strong style={{ color: scoreColor(d.score) }}>{d.score}/100</strong></p>
      <p style={{ color: "var(--color-muted-foreground)", fontSize: 11 }}>{d.raw}</p>
    </div>
  );
}

function CustomAngleAxis({ x, y, cx, cy, payload }: { x: number; y: number; cx: number; cy: number; payload: { value: string } }) {
  const dx = x - cx;
  const dy = y - cy;
  const anchor = Math.abs(dx) < 10 ? "middle" : dx > 0 ? "start" : "end";
  const offsetX = dx > 10 ? 8 : dx < -10 ? -8 : 0;
  const offsetY = dy > 10 ? 12 : dy < -10 ? -8 : 4;
  return (
    <text
      x={x + offsetX}
      y={y + offsetY}
      textAnchor={anchor}
      fill="var(--color-muted-foreground)"
      fontSize={11}
      fontWeight={600}
    >
      {payload.value}
    </text>
  );
}

export function TraderRadar({ data, isLoading }: { data: AnalyticsData | undefined; isLoading: boolean }) {
  const scores = data && data.summary.total > 0 ? computeScores(data) : null;
  const overall = scores ? Math.round(scores.reduce((s, v) => s + v.score, 0) / scores.length) : null;

  return (
    <div className="rounded-lg border border-border bg-card card-shadow p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trader Profile</p>
          {overall !== null && (
            <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: scoreColor(overall) }}>
              {overall}/100
            </p>
          )}
        </div>
        {overall !== null && (
          <p className="text-xs text-muted-foreground text-right">Overall score</p>
        )}
      </div>

      {isLoading ? (
        <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : !scores ? (
        <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">No trades yet</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={scores} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey="axis" tick={CustomAngleAxis as any} />
              <Tooltip content={<CustomTooltip />} />
              <Radar
                dataKey="score"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="var(--color-chart-1)"
                fillOpacity={0.15}
                dot={{ r: 4, fill: "var(--color-chart-1)", strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Score breakdown */}
          <div className="grid grid-cols-5 gap-2 pt-1 border-t border-border">
            {scores.map((s) => (
              <div key={s.axis} className="flex flex-col items-center gap-0.5 text-center">
                <span className="text-[10px] text-muted-foreground leading-tight">{s.axis}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(s.score) }}>{s.score}</span>
                <span className="text-[10px] text-muted-foreground">{s.raw}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
