"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

function fmtPnl(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toFixed(2);
}

const ALL_INSTRUMENTS = ["ES", "NQ", "GC", "YM", "CL", "RTY"];

const EMPTY_INSTRUMENT = (instrument: string) => ({
  instrument, pnl: 0, trades: 0, wins: 0, losses: 0, winRate: 0, avgR: 0,
});

export function InstrumentBreakdown() {
  const { data, isLoading } = useAnalytics();
  const raw = data?.byInstrument ?? [];

  const instruments = ALL_INSTRUMENTS.map(
    (name) => raw.find((r) => r.instrument === name) ?? EMPTY_INSTRUMENT(name)
  );

  const maxAbs = Math.max(...instruments.map((i) => Math.abs(i.pnl)), 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        P&amp;L by Instrument
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-8 rounded bg-muted/40 animate-pulse" />)}
        </div>
      ) : (
        <div>
          {/* Chart rows */}
          <div className="space-y-3 mb-5">
            {instruments.map((row) => {
              const pct = row.pnl === 0 ? 0 : Math.max(4, (Math.abs(row.pnl) / maxAbs) * 100);
              const positive = row.pnl > 0;
              const noData = row.pnl === 0;
              return (
                <div key={row.instrument} className="flex items-center gap-3">
                  <span className="text-xs font-semibold w-10 shrink-0 text-right text-muted-foreground">{row.instrument}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-9 relative bg-muted/10 rounded overflow-hidden">
                      <div
                        className={cn("h-full rounded transition-all duration-500", noData && "bg-muted/30")}
                        style={{
                          width: noData ? "100%" : `${pct}%`,
                          backgroundColor: noData ? undefined : positive
                            ? "color-mix(in oklch, var(--chart-1) 80%, transparent)"
                            : "color-mix(in oklch, var(--chart-2) 80%, transparent)",
                        }}
                      />
                    </div>
                    <span
                      className="text-[11px] font-semibold tabular-nums whitespace-nowrap w-16 text-right"
                      style={{ color: noData ? undefined : positive ? "var(--color-chart-1)" : "var(--color-chart-2)", opacity: noData ? 0.5 : 1 }}
                    >
                      {noData ? "$0.00" : fmtPnl(row.pnl)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border-t border-border pt-3">
            <table className="w-full text-xs tabular-nums">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-1.5 pr-4 font-medium">Instrument</th>
                  <th className="text-right py-1.5 px-3 font-medium">Trades</th>
                  <th className="text-right py-1.5 px-3 font-medium">Win Rate</th>
                  <th className="text-right py-1.5 px-3 font-medium">Avg R</th>
                  <th className="text-right py-1.5 pl-3 font-medium">P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {instruments.map((row) => (
                  <tr key={row.instrument} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="py-1.5 pr-4 font-medium">{row.instrument}</td>
                    <td className="text-right py-1.5 px-3 text-muted-foreground">{row.trades}</td>
                    <td className="text-right py-1.5 px-3 text-muted-foreground">
                      {row.wins + row.losses === 0 ? "—" : `${row.winRate.toFixed(1)}%`}
                    </td>
                    <td className="text-right py-1.5 px-3" style={{ color: row.avgR > 0 ? "var(--color-chart-1)" : row.avgR < 0 ? "var(--color-chart-2)" : undefined }}>
                      {row.avgR === 0 ? <span className="text-muted-foreground">—</span> : `${row.avgR >= 0 ? "+" : ""}${row.avgR.toFixed(2)}R`}
                    </td>
                    <td className="text-right py-1.5 pl-3 font-medium" style={{ color: row.pnl > 0 ? "var(--color-chart-1)" : row.pnl < 0 ? "var(--color-chart-2)" : undefined }}>
                      {row.pnl === 0 ? <span className="text-muted-foreground">$0.00</span> : fmtPnl(row.pnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
