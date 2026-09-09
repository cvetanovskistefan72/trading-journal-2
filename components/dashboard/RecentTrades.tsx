"use client";

import { useDashboard } from "@/hooks/useDashboard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function fmtPnl(v: number) {
  const abs = "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (v >= 0 ? "+" : "-") + abs;
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentTrades() {
  const { data, isLoading } = useDashboard();

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4 h-full">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Trades</p>
        <Link
          href="/journal"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : !data?.recentTrades.length ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No trades logged yet</p>
      ) : (
        <div>
          {/* Column headers */}
          <div className="grid grid-cols-[56px_1fr_1fr_36px_80px] sm:grid-cols-[60px_160px_1fr_36px_88px] items-center gap-x-3 px-3 pb-1.5 border-b border-border mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Date</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Instrument</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Strategy</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 text-center">Grd</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 text-right">P&L</span>
          </div>
          <div className="space-y-0.5">
            {data.recentTrades.slice(0, 10).map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[56px_1fr_1fr_36px_80px] sm:grid-cols-[60px_160px_1fr_36px_88px] items-center gap-x-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <span className="text-xs text-muted-foreground tabular-nums truncate">{fmtDate(t.date)}</span>

                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-medium shrink-0">{t.instrument}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase shrink-0"
                    style={t.direction === "long"
                      ? { backgroundColor: "color-mix(in oklch, var(--chart-4) 15%, transparent)", color: "var(--color-chart-4)" }
                      : { backgroundColor: "color-mix(in oklch, var(--chart-5) 15%, transparent)", color: "var(--color-chart-5)" }
                    }
                  >
                    {t.direction}
                  </span>
                </div>

                <span className="text-xs text-muted-foreground truncate">{t.strategyName}</span>

                <span className="text-xs font-medium text-muted-foreground text-center">
                  {t.grade || "—"}
                </span>

                <span className="text-xs font-bold tabular-nums text-right"
                  style={{ color: t.pnl > 0 ? "var(--color-chart-1)" : t.pnl < 0 ? "var(--color-chart-2)" : "var(--color-chart-3)" }}
                >
                  {fmtPnl(t.pnl)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
