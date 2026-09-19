"use client";

import type { AnalyticsData } from "@/hooks/useAnalytics";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CostOfMistakes({ data, isLoading }: { data: AnalyticsData | undefined; isLoading: boolean }) {

  const result = data ? (() => {
    const conf = data.byConfluence;
    if (conf.length < 2) return null;

    const sorted = [...conf].sort((a, b) => b.avgR - a.avgR);
    const mid = Math.ceil(sorted.length / 2);
    const top = sorted.slice(0, mid);
    const bottom = sorted.slice(mid);

    const topTrades = top.reduce((s, c) => s + c.trades, 0);
    const bottomTrades = bottom.reduce((s, c) => s + c.trades, 0);

    if (topTrades === 0 || bottomTrades === 0) return null;

    const avgPnlTop = top.reduce((s, c) => s + c.pnl, 0) / topTrades;
    const avgPnlBottom = bottom.reduce((s, c) => s + c.pnl, 0) / bottomTrades;
    const avgRTop = top.reduce((s, c) => s + c.avgR, 0) / top.length;
    const avgRBottom = bottom.reduce((s, c) => s + c.avgR, 0) / bottom.length;
    const winRateTop = top.reduce((s, c) => s + c.wins, 0) / topTrades * 100;
    const winRateBottom = bottom.reduce((s, c) => s + c.wins, 0) / bottomTrades * 100;
    const costPerTrade = avgPnlTop - avgPnlBottom;
    const totalCost = costPerTrade * bottomTrades;

    return { avgPnlTop, avgPnlBottom, avgRTop, avgRBottom, winRateTop, winRateBottom, topTrades, bottomTrades, costPerTrade, totalCost, top, bottom };
  })() : null;

  return (
    <div className="rounded-lg border border-border bg-card card-shadow p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cost of Mistakes</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Best vs worst performing setups by tag</p>
        </div>
        <AlertTriangle className="h-4 w-4 text-amber-500 opacity-70 shrink-0" />
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : !result ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Need more confluence tag data</div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Best setups */}
            <div className="rounded-lg bg-[color-mix(in_oklch,var(--color-chart-1)_10%,transparent)] border border-[color-mix(in_oklch,var(--color-chart-1)_20%,transparent)] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-chart-1)] shrink-0" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Best Setups</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-[var(--color-chart-1)]">
                  {fmtUsd(result.avgPnlTop)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">avg/trade</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.winRateTop.toFixed(0)}% win rate · {result.avgRTop >= 0 ? "+" : ""}{result.avgRTop.toFixed(2)}R
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {result.top.slice(0, 3).map((c) => (
                    <span key={c.confluence} className="text-[10px] bg-[color-mix(in_oklch,var(--color-chart-1)_15%,transparent)] text-[var(--color-chart-1)] rounded px-1.5 py-0.5 font-medium truncate max-w-[80px]">
                      {c.confluence}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Worst setups */}
            <div className="rounded-lg bg-[color-mix(in_oklch,var(--color-chart-2)_10%,transparent)] border border-[color-mix(in_oklch,var(--color-chart-2)_20%,transparent)] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[var(--color-chart-2)] shrink-0" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Worst Setups</p>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-[var(--color-chart-2)]">
                  {fmtUsd(result.avgPnlBottom)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">avg/trade</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.winRateBottom.toFixed(0)}% win rate · {result.avgRBottom >= 0 ? "+" : ""}{result.avgRBottom.toFixed(2)}R
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {result.bottom.slice(0, 3).map((c) => (
                    <span key={c.confluence} className="text-[10px] bg-[color-mix(in_oklch,var(--color-chart-2)_15%,transparent)] text-[var(--color-chart-2)] rounded px-1.5 py-0.5 font-medium truncate max-w-[80px]">
                      {c.confluence}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cost summary row */}
          <div className="rounded-lg border border-border bg-sidebar p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Estimated Cost of Bad Setups</p>
              <p className="text-xs text-muted-foreground mt-0.5">{result.bottomTrades} trades on weak setups vs your best</p>
            </div>
            <div className="text-right shrink-0">
              <p className={cn("text-xl font-bold tabular-nums", result.totalCost <= 0 ? "text-[var(--color-chart-2)]" : "text-[var(--color-chart-1)]")}>
                {fmtUsd(result.totalCost)}
              </p>
              <p className="text-[10px] text-muted-foreground">{fmtUsd(result.costPerTrade)}/trade</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
