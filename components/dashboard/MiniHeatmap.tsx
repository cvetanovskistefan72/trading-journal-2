"use client";

import { useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import type { MiniHeatmapCell } from "@/hooks/useDashboard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type TooltipState = { x: number; y: number; cell: MiniHeatmapCell } | null;

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const DOW = ["M", "T", "W", "T", "F", "S", "S"];
const CELL = 32;
const GAP = 5;
const DOW_W = 18;

export function MiniHeatmap() {
  const { data, isLoading } = useDashboard();
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const cells = data?.miniHeatmap ?? [];

  const maxAbs = cells.length > 0
    ? Math.max(...cells.map((c) => Math.abs(c.pnl)), 1)
    : 1;

  const weeks: MiniHeatmapCell[][] = [];
  if (cells.length > 0) {
    const firstDow = (new Date(cells[0].date + "T12:00:00").getDay() + 6) % 7;
    const padded: (MiniHeatmapCell | null)[] = [
      ...Array(firstDow).fill(null),
      ...cells,
    ];
    for (let i = 0; i < padded.length; i += 7) {
      weeks.push(padded.slice(i, i + 7) as MiniHeatmapCell[]);
    }
  }

  const svgW = DOW_W + weeks.length * (CELL + GAP);
  const svgH = 7 * (CELL + GAP) - GAP;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last 35 Days</p>
          <p className="text-xs text-muted-foreground mt-0.5">Daily P&L heatmap</p>
        </div>
        <Link
          href="/analytics/performance#heatmap"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Full view <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Vertically centered body */}
      <div className="flex-1 flex flex-col justify-center gap-4">
        {isLoading ? (
          <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            {/* Tooltip */}
            {tooltip && (
              <div
                className="pointer-events-none fixed z-50 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
                style={{ left: tooltip.x + 12, top: tooltip.y - 8, minWidth: 130 }}
              >
                <p className="font-semibold mb-1">{fmtDate(tooltip.cell.date)}</p>
                {tooltip.cell.trades > 0 ? (
                  <>
                    <p>P&L: <strong style={{ color: tooltip.cell.pnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(tooltip.cell.pnl)}</strong></p>
                    <p className="text-muted-foreground mt-0.5">{tooltip.cell.wins}W / {tooltip.cell.losses}L · {tooltip.cell.trades} Trade{tooltip.cell.trades !== 1 ? "s" : ""}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No trades</p>
                )}
              </div>
            )}

            {/* SVG grid — left-aligned, DOW labels beside it */}
            <div className="flex items-center gap-3 pl-4">
              {/* Day-of-week labels */}
              <div className="flex flex-col gap-0" style={{ gap: GAP }}>
                {DOW.map((label, i) => (
                  <div
                    key={i}
                    className="text-[9px] text-muted-foreground flex items-center justify-end"
                    style={{ height: CELL, width: 12 }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              <svg width={svgW - DOW_W} height={svgH} className="block overflow-visible">
                {weeks.map((week, wi) =>
                  week.map((cell, di) => {
                    const x = wi * (CELL + GAP);
                    const y = di * (CELL + GAP);

                    if (!cell) {
                      return <rect key={`${wi}-${di}`} x={x} y={y} width={CELL} height={CELL} rx={3} fill="var(--color-muted-foreground)" opacity={0.06} />;
                    }

                    let fill = "var(--color-muted-foreground)";
                    let opacity = 0.1;

                    if (cell.trades > 0) {
                      const intensity = Math.min(Math.abs(cell.pnl) / maxAbs, 1);
                      fill = cell.pnl > 0 ? "var(--color-chart-1)" : "var(--color-chart-2)";
                      opacity = 0.25 + intensity * 0.65;
                    }

                    return (
                      <g key={`${wi}-${di}`}>
                        <rect x={x} y={y} width={CELL} height={CELL} rx={3} fill={fill} opacity={opacity} />
                        <rect
                          x={x} y={y} width={CELL} height={CELL} rx={3} fill="transparent"
                          style={{ cursor: cell.trades > 0 ? "pointer" : "default" }}
                          onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, cell })}
                          onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY, cell })}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      </g>
                    );
                  })
                )}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 pl-4">
              <span className="text-[10px] text-muted-foreground">Loss</span>
              {[0.9, 0.55, 0.3].map((op) => (
                <svg key={op} width={10} height={10}>
                  <rect width={10} height={10} rx={2} fill="var(--color-chart-2)" opacity={op} />
                </svg>
              ))}
              <div className="w-px h-3 bg-border mx-0.5" />
              {[0.3, 0.55, 0.9].map((op) => (
                <svg key={op} width={10} height={10}>
                  <rect width={10} height={10} rx={2} fill="var(--color-chart-1)" opacity={op} />
                </svg>
              ))}
              <span className="text-[10px] text-muted-foreground">Win</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
