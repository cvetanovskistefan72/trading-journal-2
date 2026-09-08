"use client";

import { useQuery } from "@tanstack/react-query";

type SessionBucket = {
  session: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgR: number;
};

function fmtUsd(v: number) {
  const abs = Math.abs(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (v >= 0 ? "+" : "-") + "$" + abs;
}

function SessionCard({ bucket }: { bucket: SessionBucket }) {
  const positive = bucket.pnl >= 0;

  return (
    <div
      className={[
        "rounded-xl border p-4 space-y-3 transition-colors",
        positive
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-rose-500/5 border-rose-500/20",
      ].join(" ")}
    >
      {/* Session name */}
      <p
        className={[
          "text-sm font-semibold capitalize truncate",
          positive ? "text-emerald-500" : "text-rose-500",
        ].join(" ")}
      >
        {bucket.session}
      </p>

      {/* P&L */}
      <p
        className={[
          "text-2xl font-bold tabular-nums leading-none",
          positive ? "text-emerald-500" : "text-rose-500",
        ].join(" ")}
      >
        {fmtUsd(bucket.pnl)}
      </p>

      {/* Win rate with inline progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Win rate</span>
          <span className="tabular-nums font-medium">{bucket.winRate}%</span>
        </div>
        <div className="bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(bucket.winRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground tabular-nums">{bucket.trades}</span> trades
        </span>
        <span>
          <span className="font-medium text-foreground tabular-nums">
            {bucket.avgR >= 0 ? "+" : ""}
            {bucket.avgR}R
          </span>{" "}
          avg
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
          {bucket.wins}W
        </span>
        <span className="text-rose-600 dark:text-rose-400 tabular-nums">
          {bucket.losses}L
        </span>
      </div>
    </div>
  );
}

export function SessionBreakdown() {
  const { data = [], isLoading } = useQuery<SessionBucket[]>({
    queryKey: ["analytics", "by-session"],
    queryFn: () => fetch("/api/analytics/by-session").then((r) => r.json()),
    staleTime: 60_000,
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Performance by Session
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 animate-pulse"
            >
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
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          No trades yet
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((bucket) => (
            <SessionCard key={bucket.session} bucket={bucket} />
          ))}
        </div>
      )}
    </div>
  );
}
