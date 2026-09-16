"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MONTHS, DAY_LABELS, RESULT_DOT, RESULT_BG, RESULT_TEXT,
  fmtPnl, toDateKey, buildCalendarGrid,
} from "@/lib/calendar";
import { DayDialog } from "@/components/calendar/DayDialog";
import type { CalendarDay } from "@/types/calendar";

import { getCalendar } from "@/services/analytics.service";

function getWeekNumber(year: number, month: number, weekIndex: number, weeks: (Date | null)[][]): number {
  const week = weeks[weekIndex];
  const firstDate = week.find(Boolean) as Date;
  const d = new Date(firstDate);
  d.setHours(12, 0, 0, 0);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / 86400000) + 1;
  return Math.ceil(dayOfYear / 7);
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const { data = [], isFetching } = useQuery<CalendarDay[]>({
    queryKey: ["calendar", monthKey],
    queryFn: () => getCalendar(monthKey) as Promise<CalendarDay[]>,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const dayMap = useMemo(() => {
    const m = new Map<string, CalendarDay>();
    for (const d of data) m.set(d.date, d);
    return m;
  }, [data]);

  const weeks = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const weeklyStats = useMemo(() =>
    weeks.map(week => {
      let pnl = 0, count = 0, wins = 0, losses = 0, bes = 0;
      for (const d of week) {
        if (!d) continue;
        const entry = dayMap.get(toDateKey(d));
        if (!entry) continue;
        pnl += entry.pnl;
        count += entry.tradeCount;
        if (entry.result === "win") wins++;
        else if (entry.result === "loss") losses++;
        else bes++;
      }
      return { pnl: Math.round(pnl * 100) / 100, count, wins, losses, bes };
    }),
    [weeks, dayMap]
  );

  const totalPnl = useMemo(() => data.reduce((s, d) => s + d.pnl, 0), [data]);
  const totalTrades = useMemo(() => data.reduce((s, d) => s + d.tradeCount, 0), [data]);
  const winDays = useMemo(() => data.filter(d => d.result === "win").length, [data]);
  const lossDays = useMemo(() => data.filter(d => d.result === "loss").length, [data]);
  const beDays = useMemo(() => data.filter(d => d.result === "breakeven").length, [data]);
  const tradingDays = winDays + lossDays + beDays;
  const dayWinRate = tradingDays > 0 ? Math.round((winDays / tradingDays) * 100) : null;

  const today = toDateKey(new Date());
  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i);

  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function prevMonth() {
    if (navTimer.current) return;
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    navTimer.current = setTimeout(() => { navTimer.current = null; }, 300);
  }
  function nextMonth() {
    if (navTimer.current) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    navTimer.current = setTimeout(() => { navTimer.current = null; }, 300);
  }

  function handleDayClick(key: string) {
    const entry = dayMap.get(key);
    if (!entry) return;
    setSelectedDay(entry);
    setDialogOpen(true);
  }

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">Click any trading day to see your trades</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={prevMonth} disabled={isFetching} className="p-2 rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            {MONTHS.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={nextMonth} disabled={isFetching} className="p-2 rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Monthly summary bar */}
      {totalTrades > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Net P&amp;L</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: totalPnl >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" }}>
              {fmtPnl(totalPnl)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Total Trades</p>
            <p className="text-xl font-bold tabular-nums text-foreground">{totalTrades}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Day Win Rate</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: "var(--color-chart-1)" }}>
              {dayWinRate !== null ? `${dayWinRate}%` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Days</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-sm font-bold" style={{ color: "var(--color-chart-1)" }}>
                <TrendingUp className="h-3.5 w-3.5" />{winDays}
              </span>
              <span className="flex items-center gap-1 text-sm font-bold" style={{ color: "var(--color-chart-2)" }}>
                <TrendingDown className="h-3.5 w-3.5" />{lossDays}
              </span>
              {beDays > 0 && (
                <span className="flex items-center gap-1 text-sm font-bold" style={{ color: "var(--color-chart-3)" }}>
                  <Minus className="h-3.5 w-3.5" />{beDays}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className={cn("rounded-2xl border border-border bg-card overflow-hidden transition-opacity", isFetching && "opacity-60")}>

        {/* Column headers: week # | Mon–Sun */}
        <div className="grid grid-cols-[52px_repeat(7,1fr)] bg-muted/40 border-b border-border">
          <div className="py-3 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest text-center flex items-center justify-center gap-1">
            <Calendar className="h-3 w-3" />
          </div>
          {DAY_LABELS.map((d, i) => (
            <div key={d} className={cn("py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest text-center", i >= 5 && "text-muted-foreground/50")}>
              {d}
            </div>
          ))}
        </div>

        {/* Rows */}
        {weeks.map((week, wi) => {
          const ws = weeklyStats[wi];
          const wn = getWeekNumber(year, month, wi, weeks);
          return (
            <div key={wi} className="grid grid-cols-[52px_repeat(7,1fr)]">

              {/* Week number column */}
              <div className="border-b border-r border-border/60 flex flex-col items-center justify-center gap-1 bg-muted/30 py-3">
                <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-widest">Wk</span>
                <span className="text-xs font-bold text-muted-foreground/60">{wn}</span>
                {ws.count > 0 && (
                  <span
                    className="text-[10px] font-bold tabular-nums mt-0.5"
                    style={{ color: ws.pnl > 0 ? "var(--color-chart-1)" : ws.pnl < 0 ? "var(--color-chart-2)" : "var(--color-chart-3)" }}
                  >
                    {fmtPnl(ws.pnl, true)}
                  </span>
                )}
              </div>

              {/* Day cells */}
              {week.map((day, di) => {
                const isWeekend = di >= 5;
                if (!day) {
                  return (
                    <div
                      key={di}
                      className={cn(
                        "min-h-[110px] border-b border-r border-border/60",
                        di === 6 && "border-r-0",
                        isWeekend && "bg-muted/15"
                      )}
                    />
                  );
                }
                const key = toDateKey(day);
                const entry = dayMap.get(key);
                const isToday = key === today;
                const hasData = !!entry;

                return (
                  <div
                    key={di}
                    onClick={() => hasData && handleDayClick(key)}
                    className={cn(
                      "min-h-[110px] border-b border-r border-border/60 p-2.5 flex flex-col transition-all duration-150 group",
                      di === 6 && "border-r-0",
                      isWeekend && !hasData && "bg-muted/15",
                      hasData && RESULT_BG[entry.result],
                      hasData && "cursor-pointer",
                    )}
                  >
                    {/* Date number */}
                    <div className="flex items-start justify-between mb-auto">
                      <span className={cn(
                        "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0 transition-colors",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : hasData
                            ? "text-foreground group-hover:bg-muted/60"
                            : "text-muted-foreground/40"
                      )}>
                        {day.getDate()}
                      </span>
                      {hasData && (
                        <span className={cn("w-1.5 h-1.5 rounded-full mt-1 shrink-0", RESULT_DOT[entry.result])} />
                      )}
                    </div>

                    {/* P&L + trades */}
                    {hasData && (
                      <div className="mt-2 space-y-1">
                        <p className={cn("text-sm font-bold tabular-nums leading-none", RESULT_TEXT[entry.result])}>
                          {fmtPnl(entry.pnl, true)}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-none">
                          {entry.tradeCount} trade{entry.tradeCount !== 1 ? "s" : ""}
                        </p>
                        {/* Thin accent bar at bottom */}
                        <div
                          className="h-0.5 w-full rounded-full mt-1 opacity-60"
                          style={{
                            backgroundColor:
                              entry.result === "win" ? "var(--color-chart-1)" :
                              entry.result === "loss" ? "var(--color-chart-2)" :
                              "var(--color-chart-3)"
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-chart-1)" }} />Win day
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-chart-2)" }} />Loss day
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-chart-3)" }} />Breakeven
        </div>
        <div className="ml-auto text-[11px] text-muted-foreground/40">Click a day to view trades</div>
      </div>

      <DayDialog day={selectedDay} open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </main>
  );
}
