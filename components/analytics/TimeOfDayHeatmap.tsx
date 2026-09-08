"use client";

import { useMemo } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { TimeOfDayCell } from "@/hooks/useAnalytics";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

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
  const opacity = 0.2 + intensity * 0.8;
  return {
    fill: avgPnl > 0 ? "var(--color-chart-1)" : "var(--color-chart-2)",
    opacity,
  };
}

export function TimeOfDayHeatmap() {
  const { data, isLoading } = useAnalytics();
  const cells = data?.timeOfDay ?? [];

  const hours = useMemo(() => [...new Set(cells.map((c) => c.hour))].sort((a, b) => a - b), [cells]);
  const maxAbs = useMemo(() => Math.max(...cells.map((c) => Math.abs(c.avgPnl)), 1), [cells]);

  // Build lookup: "hour-day" -> cell
  const cellMap = useMemo(() => new Map(cells.map((c) => [`${c.hour}-${c.day}`, c])), [cells]);

  const hasTrades = cells.some((c) => c.trades > 0);

  const CELL_W = 52;
  const CELL_H = 36;
  const LABEL_W = 40;
  const LABEL_H = 24;
  const GAP = 3;

  const svgW = LABEL_W + DAYS.length * (CELL_W + GAP);
  const svgH = LABEL_H + hours.length * (CELL_H + GAP);

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
        <div className="overflow-x-auto flex justify-center">
          <svg width={svgW} height={svgH} className="block">
            {/* Day column headers */}
            {DAYS.map((day, di) => (
              <text
                key={day}
                x={LABEL_W + di * (CELL_W + GAP) + CELL_W / 2}
                y={LABEL_H - 6}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill="var(--color-muted-foreground)"
                fontFamily="inherit"
              >
                {day}
              </text>
            ))}

            {/* Hour row labels + cells */}
            {hours.map((hour, hi) => (
              <g key={hour}>
                {/* Hour label */}
                <text
                  x={LABEL_W - 6}
                  y={LABEL_H + hi * (CELL_H + GAP) + CELL_H / 2 + 4}
                  textAnchor="end"
                  fontSize={9}
                  fill="var(--color-muted-foreground)"
                  fontFamily="inherit"
                >
                  {fmtHour(hour)}
                </text>

                {/* Day cells for this hour */}
                {DAYS.map((day, di) => {
                  const cell = cellMap.get(`${hour}-${day}`);
                  const x = LABEL_W + di * (CELL_W + GAP);
                  const y = LABEL_H + hi * (CELL_H + GAP);
                  const { fill, opacity } = cell && cell.trades > 0
                    ? cellColor(cell.avgPnl, maxAbs)
                    : { fill: "var(--color-muted-foreground)", opacity: 0.08 };

                  return (
                    <g key={day}>
                      <rect x={x} y={y} width={CELL_W} height={CELL_H} rx={4} fill={fill} opacity={opacity} />
                      {cell && cell.trades > 0 && (
                        <>
                          <text
                            x={x + CELL_W / 2}
                            y={y + CELL_H / 2 - 3}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight={700}
                            fill="var(--color-foreground)"
                            fontFamily="inherit"
                          >
                            {fmtUsd(cell.avgPnl)}
                          </text>
                          <text
                            x={x + CELL_W / 2}
                            y={y + CELL_H / 2 + 10}
                            textAnchor="middle"
                            fontSize={8}
                            fill="var(--color-muted-foreground)"
                            fontFamily="inherit"
                          >
                            {cell.trades}T · {cell.winRate.toFixed(0)}%
                          </text>
                        </>
                      )}
                      {cell && cell.trades > 0 && (
                        <title>
                          {day} {fmtHour(hour)}
                          {"\n"}Avg P&L: {fmtUsd(cell.avgPnl)}
                          {"\n"}Win Rate: {cell.winRate.toFixed(1)}%
                          {"\n"}{cell.trades} Trade{cell.trades !== 1 ? "s" : ""} ({cell.wins}W / {cell.losses}L)
                        </title>
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
      <div className="flex items-center justify-center gap-2" style={{ paddingLeft: LABEL_W }}>
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
