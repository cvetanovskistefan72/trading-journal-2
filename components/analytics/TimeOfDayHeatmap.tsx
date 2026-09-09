"use client";

import { useMemo, useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { TimeOfDayCell } from "@/hooks/useAnalytics";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
// Always show 6am–8pm regardless of data
const ALL_HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6..20

function fmtHour(h: number) {
  const suffix = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}${suffix}`;
}

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function cellColor(avgPnl: number, maxAbs: number): { fill: string; opacity: number } {
  if (maxAbs === 0 || avgPnl === 0) return { fill: "var(--color-muted-foreground)", opacity: 0.1 };
  const intensity = Math.min(Math.abs(avgPnl) / maxAbs, 1);
  return {
    fill: avgPnl > 0 ? "var(--color-chart-1)" : "var(--color-chart-2)",
    opacity: 0.2 + intensity * 0.8,
  };
}

type TooltipState = { x: number; y: number; cell: TimeOfDayCell } | null;

export function TimeOfDayHeatmap() {
  const { data, isLoading } = useAnalytics();
  const cells = data?.timeOfDay ?? [];
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const maxAbs = useMemo(() => Math.max(...cells.map((c) => Math.abs(c.avgPnl)), 1), [cells]);

  // lookup: "hour-day" -> cell
  const cellMap = useMemo(() => new Map(cells.map((c) => [`${c.hour}-${c.day}`, c])), [cells]);

  const hasTrades = cells.some((c) => c.trades > 0);

  // Layout: hours on X, days on Y
  const CELL_W = 52;
  const CELL_H = 36;
  const LABEL_W = 36; // day label column width
  const LABEL_H = 22; // hour header row height
  const GAP = 3;

  const svgW = LABEL_W + ALL_HOURS.length * (CELL_W + GAP);
  const svgH = LABEL_H + DAYS.length * (CELL_H + GAP);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Time of Day Performance</p>
        <p className="text-xs text-muted-foreground mt-0.5">Avg P&L by entry hour — Mon to Fri</p>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : !hasTrades ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No trades yet</div>
      ) : (
        <div className="overflow-x-auto">
          {tooltip && (
            <div
              className="pointer-events-none fixed z-50 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
              style={{ left: tooltip.x + 12, top: tooltip.y - 8, minWidth: 140 }}
            >
              <p className="font-semibold mb-1">{tooltip.cell.day} {fmtHour(tooltip.cell.hour)}</p>
              <p>Avg P&L: <strong style={{ color: tooltip.cell.avgPnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(tooltip.cell.avgPnl)}</strong></p>
              <p>Win rate: <strong>{tooltip.cell.winRate.toFixed(1)}%</strong></p>
              <p className="text-muted-foreground mt-0.5">{tooltip.cell.trades} Trade{tooltip.cell.trades !== 1 ? "s" : ""} ({tooltip.cell.wins}W / {tooltip.cell.losses}L)</p>
            </div>
          )}
          <svg width={svgW} height={svgH} className="block">

            {/* Hour column headers (X axis) */}
            {ALL_HOURS.map((hour, hi) => (
              <text
                key={hour}
                x={LABEL_W + hi * (CELL_W + GAP) + CELL_W / 2}
                y={LABEL_H - 6}
                textAnchor="middle"
                fontSize={9}
                fontWeight={600}
                fill="var(--color-muted-foreground)"
                fontFamily="inherit"
              >
                {fmtHour(hour)}
              </text>
            ))}

            {/* Day rows (Y axis) */}
            {DAYS.map((day, di) => (
              <g key={day}>
                {/* Day label */}
                <text
                  x={LABEL_W - 6}
                  y={LABEL_H + di * (CELL_H + GAP) + CELL_H / 2 + 4}
                  textAnchor="end"
                  fontSize={10}
                  fontWeight={600}
                  fill="var(--color-muted-foreground)"
                  fontFamily="inherit"
                >
                  {day}
                </text>

                {/* Hour cells for this day */}
                {ALL_HOURS.map((hour, hi) => {
                  const cell = cellMap.get(`${hour}-${day}`);
                  const x = LABEL_W + hi * (CELL_W + GAP);
                  const y = LABEL_H + di * (CELL_H + GAP);
                  const hasData = !!cell && cell.trades > 0;
                  const { fill, opacity } = hasData
                    ? cellColor(cell.avgPnl, maxAbs)
                    : { fill: "var(--color-muted-foreground)", opacity: 0.08 };

                  return (
                    <g key={hour}>
                      <rect x={x} y={y} width={CELL_W} height={CELL_H} rx={4} fill={fill} opacity={opacity} />
                      {hasData && (
                        <>
                          <text x={x + CELL_W / 2} y={y + CELL_H / 2 - 3} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--color-foreground)" fontFamily="inherit">
                            {fmtUsd(cell.avgPnl)}
                          </text>
                          <text x={x + CELL_W / 2} y={y + CELL_H / 2 + 10} textAnchor="middle" fontSize={8} fill="var(--color-muted-foreground)" fontFamily="inherit">
                            {cell.trades}T · {cell.winRate.toFixed(0)}%
                          </text>
                          {/* transparent hit area */}
                          <rect
                            x={x} y={y} width={CELL_W} height={CELL_H} rx={4} fill="transparent"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, cell })}
                            onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY, cell })}
                            onMouseLeave={() => setTooltip(null)}
                          />
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2" style={{ paddingLeft: LABEL_W }}>
        <span className="text-[10px] text-muted-foreground">Worst</span>
        {[0.2, 0.45, 0.7, 1].map((op) => (
          <svg key={op} width={16} height={16}>
            <rect width={16} height={16} rx={3} fill="var(--color-chart-2)" opacity={op} />
          </svg>
        ))}
        <div className="w-px h-3 bg-border mx-0.5" />
        {[0.2, 0.45, 0.7, 1].map((op) => (
          <svg key={op} width={16} height={16}>
            <rect width={16} height={16} rx={3} fill="var(--color-chart-1)" opacity={op} />
          </svg>
        ))}
        <span className="text-[10px] text-muted-foreground">Best</span>
      </div>
    </div>
  );
}
