"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import type { SessionBucket } from "@/hooks/useAnalytics";

function fmtUsd(v: number) {
  const abs = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (v >= 0 ? "+" : "-") + "$" + abs;
}

function SessionCard({ bucket }: { bucket: SessionBucket }) {
  const empty = bucket.trades === 0;
  const positive = bucket.pnl > 0;
  const negative = bucket.pnl < 0;

  return (
    <div
      className="rounded-xl border p-4 space-y-3 transition-colors"
      style={empty ? undefined : {
        backgroundColor: positive
          ? "color-mix(in oklch, var(--chart-1) 5%, transparent)"
          : "color-mix(in oklch, var(--chart-2) 5%, transparent)",
        borderColor: positive
          ? "color-mix(in oklch, var(--chart-1) 20%, transparent)"
          : "color-mix(in oklch, var(--chart-2) 20%, transparent)",
      }}
    >
      <p
        className="text-sm font-semibold capitalize truncate"
        style={empty ? undefined : { color: positive ? "var(--color-chart-1)" : "var(--color-chart-2)" }}
      >
        {bucket.session}
      </p>
      <p
        className="text-2xl font-bold tabular-nums leading-none"
        style={empty ? { color: "color-mix(in oklch, currentColor 40%, transparent)" } : { color: positive ? "var(--color-chart-1)" : "var(--color-chart-2)" }}
      >
        {empty ? "$0.00" : fmtUsd(bucket.pnl)}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Win rate</span>
          <span className="tabular-nums font-medium">{bucket.winRate}%</span>
        </div>
        <div className="bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(bucket.winRate, 100)}%`, backgroundColor: "var(--color-chart-1)" }} />
        </div>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><span className="font-medium text-foreground tabular-nums">{bucket.trades}</span> Trades</span>
        <span><span className="font-medium text-foreground tabular-nums">{bucket.avgR >= 0 ? "+" : ""}{bucket.avgR}R</span> avg</span>
        <span className="tabular-nums" style={{ color: "var(--color-chart-1)" }}>{bucket.wins}W</span>
        <span className="tabular-nums" style={{ color: "var(--color-chart-2)" }}>{bucket.losses}L</span>
      </div>
    </div>
  );
}

const ALL_SESSIONS = ["New York", "London", "Asia"] as const;

const EMPTY_BUCKET = (session: string): SessionBucket => ({
  session,
  pnl: 0,
  trades: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  avgR: 0,
});

export function SessionBreakdown() {
  const { data, isLoading } = useAnalytics();
  const sessions = data?.bySession ?? [];

  // Always show all 3 sessions — fill missing ones with zeroes
  const allSessions = ALL_SESSIONS.map(
    (name) => sessions.find((s) => s.session === name) ?? EMPTY_BUCKET(name)
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Performance by Session
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="space-y-1">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-1.5 bg-muted rounded-full w-full" />
              </div>
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allSessions.map((bucket) => (
            <SessionCard key={bucket.session} bucket={bucket} />
          ))}
        </div>
      )}
    </div>
  );
}
