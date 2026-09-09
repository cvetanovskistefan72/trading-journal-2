"use client";

import { useMemo, useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { CalendarDay as HeatmapDay } from "@/hooks/useAnalytics";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayDialog } from "@/components/calendar/DayDialog";
import type { CalendarDay } from "@/types/calendar";

type TooltipState = { x: number; y: number; day: HeatmapDay } | null;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function fmtUsd(v: number) {
  return (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function buildYearGrid(year: number, dayMap: Map<string, HeatmapDay>) {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);

  const start = new Date(jan1);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const end = new Date(dec31);
  const toSun = (7 - end.getDay()) % 7;
  end.setDate(end.getDate() + toSun);

  const weeks: { date: string; inYear: boolean; day: HeatmapDay | null; monthStart?: number }[][] = [];
  const cur = new Date(start);
  let lastMonth = -1;

  while (cur <= end) {
    const week: (typeof weeks)[number] = [];
    for (let dow = 0; dow < 7; dow++) {
      const iso = cur.toISOString().slice(0, 10);
      const inYear = cur.getFullYear() === year;
      const month = cur.getMonth();
      week.push({
        date: iso,
        inYear,
        day: dayMap.get(iso) ?? null,
        monthStart: inYear && month !== lastMonth && dow === 0 ? month : undefined,
      });
      if (inYear && month !== lastMonth && dow === 0) lastMonth = month;
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const monthPositions: { col: number; month: number }[] = [];
  weeks.forEach((week, wi) => {
    week.forEach((cell) => {
      if (cell.monthStart !== undefined) monthPositions.push({ col: wi, month: cell.monthStart });
    });
  });

  return { weeks, monthPositions };
}

export function CalendarHeatmap() {
  const { data, isLoading } = useAnalytics();
  const calDays = data?.calendarHeatmap ?? [];

  const dayMap = useMemo(() => new Map(calDays.map((d) => [d.date, d])), [calDays]);
  const maxAbs = useMemo(() => Math.max(...calDays.map((d) => Math.abs(d.pnl)), 1), [calDays]);

  const availableYears = useMemo(() => {
    if (calDays.length === 0) return [new Date().getFullYear()];
    const years = [...new Set(calDays.map((d) => new Date(d.date).getFullYear()))].sort((a, b) => b - a);
    return years;
  }, [calDays]);

  const [yearIndex, setYearIndex] = useState(0);
  const year = availableYears[yearIndex] ?? new Date().getFullYear();

  const { weeks, monthPositions } = useMemo(() => buildYearGrid(year, dayMap), [year, dayMap]);

  const yearTotal = useMemo(
    () => calDays.filter((d) => new Date(d.date).getFullYear() === year).reduce((s, d) => s + d.pnl, 0),
    [calDays, year]
  );
  const yearTradeDays = useMemo(
    () => calDays.filter((d) => new Date(d.date).getFullYear() === year).length,
    [calDays, year]
  );

  // Dialog state — fetch full day data on click
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogDay, setDialogDay] = useState<CalendarDay | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  async function handleCellClick(date: string) {
    setSelectedDate(date);
    setLoadingDay(true);
    setDialogOpen(true);
    try {
      const res = await fetch(`/api/trades/calendar?date=${date}`);
      const days: CalendarDay[] = await res.json();
      setDialogDay(days[0] ?? null);
    } finally {
      setLoadingDay(false);
    }
  }

  const CELL = 16;
  const GAP = 3;
  const DOW_W = 28;
  const svgW = DOW_W + weeks.length * (CELL + GAP);
  const svgH = 16 + 7 * (CELL + GAP);

  return (
    <div id="heatmap" className="rounded-2xl border border-border bg-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trading Heatmap</p>
          <p className="text-xs text-muted-foreground mt-0.5">Daily P&L — click a day to view trades</p>
        </div>
        <div className="flex items-center gap-2">
          {yearTradeDays > 0 && (
            <span className="text-sm font-bold tabular-nums" style={{ color: yearTotal >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
              {fmtUsd(yearTotal)}
            </span>
          )}
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setYearIndex((i) => Math.min(i + 1, availableYears.length - 1))}
              disabled={yearIndex >= availableYears.length - 1 || loadingDay}
              className="p-1.5 hover:bg-accent transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-semibold px-2 tabular-nums">{year}</span>
            <button
              onClick={() => setYearIndex((i) => Math.max(i - 1, 0))}
              disabled={yearIndex <= 0 || loadingDay}
              className="p-1.5 hover:bg-accent transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-28 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex justify-center" style={{ minWidth: svgW }}>
          {tooltip && (
            <div
              className="pointer-events-none fixed z-50 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
              style={{ left: tooltip.x + 12, top: tooltip.y - 8, minWidth: 140 }}
            >
              <p className="font-semibold mb-1">
                {new Date(tooltip.day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
              <p>P&L: <strong style={{ color: tooltip.day.pnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>{fmtUsd(tooltip.day.pnl)}</strong></p>
              <p className="text-muted-foreground mt-0.5">{tooltip.day.wins}W / {tooltip.day.losses}L · {tooltip.day.trades} Trade{tooltip.day.trades !== 1 ? "s" : ""}</p>
            </div>
          )}
          <svg width={svgW} height={svgH} className="block">
            {/* Month labels */}
            {monthPositions.map(({ col, month }) => (
              <text key={month} x={DOW_W + col * (CELL + GAP)} y={10} fontSize={9} fill="var(--color-muted-foreground)" fontFamily="inherit">
                {MONTHS[month]}
              </text>
            ))}

            {/* Day-of-week labels */}
            {DOW_LABELS.map((label, i) =>
              label ? (
                <text key={i} x={0} y={16 + i * (CELL + GAP) + CELL / 2 + 3} fontSize={8} fill="var(--color-muted-foreground)" fontFamily="inherit">
                  {label}
                </text>
              ) : null
            )}

            {/* Cells */}
            {weeks.map((week, wi) =>
              week.map((cell, di) => {
                const x = DOW_W + wi * (CELL + GAP);
                const y = 16 + di * (CELL + GAP);
                const d = cell.day;
                const isEmpty = !cell.inYear;

                let fill = "var(--color-muted-foreground)";
                let opacity = isEmpty ? 0.08 : 0.12;

                if (!isEmpty && d) {
                  const intensity = Math.min(Math.abs(d.pnl) / (maxAbs || 1), 1);
                  fill = d.pnl > 0 ? "var(--color-chart-1)" : "var(--color-chart-2)";
                  opacity = 0.25 + intensity * 0.75;
                }

                const isSelected = d?.date === selectedDate;

                return (
                  <g key={`${wi}-${di}`}>
                    <rect
                      x={x} y={y}
                      width={CELL} height={CELL}
                      rx={2} ry={2}
                      fill={fill}
                      opacity={opacity}
                      stroke={isSelected ? "var(--color-foreground)" : "none"}
                      strokeWidth={isSelected ? 1.5 : 0}
                    />
                    {/* transparent hit area for reliable mouse events */}
                    <rect
                      x={x} y={y}
                      width={CELL} height={CELL}
                      rx={2} ry={2}
                      fill="transparent"
                      style={{ cursor: d ? "pointer" : "default" }}
                      onClick={() => d && !loadingDay && handleCellClick(d.date)}
                      onMouseEnter={(e) => d && setTooltip({ x: e.clientX, y: e.clientY, day: d })}
                      onMouseMove={(e) => d && setTooltip({ x: e.clientX, y: e.clientY, day: d })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  </g>
                );
              })
            )}
          </svg>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {[0.25, 0.5, 0.75, 1].map((op) => (
          <svg key={op} width={11} height={11}>
            <rect width={11} height={11} rx={2} fill="var(--color-chart-2)" opacity={op} />
          </svg>
        ))}
        <div className="w-px h-3 bg-border mx-0.5" />
        {[0.25, 0.5, 0.75, 1].map((op) => (
          <svg key={op} width={11} height={11}>
            <rect width={11} height={11} rx={2} fill="var(--color-chart-1)" opacity={op} />
          </svg>
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
        <span className="text-[10px] text-muted-foreground ml-2">· {yearTradeDays} active day{yearTradeDays !== 1 ? "s" : ""}</span>
      </div>

      {/* Reuse the same DayDialog as the calendar page */}
      <DayDialog
        day={loadingDay ? null : dialogDay}
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedDate(null); setDialogDay(null); }}
      />
    </div>
  );
}
