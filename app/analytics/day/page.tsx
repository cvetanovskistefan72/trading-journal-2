"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MONTHS, DAY_LABELS, RESULT_DOT, RESULT_BG, RESULT_TEXT,
  fmtPnl, toDateKey, buildCalendarGrid,
} from "@/lib/calendar";
import { DayDialog } from "@/components/calendar/DayDialog";
import type { CalendarDay } from "@/types/calendar";

async function fetchCalendar(month: string): Promise<CalendarDay[]> {
  const res = await fetch(`/api/trades/calendar?month=${month}`);
  if (!res.ok) throw new Error("Failed to fetch calendar");
  return res.json();
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
    queryFn: () => fetchCalendar(monthKey),
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
      let pnl = 0, count = 0, wins = 0, losses = 0;
      for (const d of week) {
        if (!d) continue;
        const entry = dayMap.get(toDateKey(d));
        if (!entry) continue;
        pnl += entry.pnl;
        count += entry.tradeCount;
        if (entry.result === "win") wins++;
        else if (entry.result === "loss") losses++;
      }
      return { pnl: Math.round(pnl * 100) / 100, count, wins, losses };
    }),
    [weeks, dayMap]
  );

  const totalPnl = useMemo(() => data.reduce((s, d) => s + d.pnl, 0), [data]);
  const totalTrades = useMemo(() => data.reduce((s, d) => s + d.tradeCount, 0), [data]);
  const winDays = useMemo(() => data.filter(d => d.result === "win").length, [data]);
  const lossDays = useMemo(() => data.filter(d => d.result === "loss").length, [data]);
  const today = toDateKey(new Date());
  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
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
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            {totalTrades > 0 ? (
              <>
                <span className={cn("font-semibold", totalPnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                  {fmtPnl(totalPnl)}
                </span>
                <span>·</span>
                <span>{totalTrades} trade{totalTrades !== 1 ? "s" : ""}</span>
                <span>·</span>
                <span className="text-emerald-500">{winDays}W</span>
                <span className="text-rose-500">{lossDays}L</span>
              </>
            ) : (
              <span>No trades this month</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={prevMonth} className="p-2 rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
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
          <button onClick={nextMonth} className="p-2 rounded-lg border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className={cn("rounded-2xl border border-border overflow-hidden shadow-sm transition-opacity", isFetching && "opacity-60")}>

        {/* Headers */}
        <div className="grid grid-cols-[repeat(7,1fr)_88px] bg-muted/40 border-b border-border">
          {DAY_LABELS.map((d, i) => (
            <div key={d} className={cn("py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest text-center", i >= 5 && "text-muted-foreground/60")}>
              {d}
            </div>
          ))}
          <div className="py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest text-center bg-muted/60">
            Week
          </div>
        </div>

        {/* Rows */}
        {weeks.map((week, wi) => {
          const ws = weeklyStats[wi];
          return (
            <div key={wi} className="grid grid-cols-[repeat(7,1fr)_88px]">
              {week.map((day, di) => {
                const isWeekend = di >= 5;
                if (!day) {
                  return (
                    <div key={di} className={cn("min-h-[100px] border-b border-r border-border/60", di === 6 && "border-r-0", isWeekend && "bg-muted/20")} />
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
                      "min-h-[100px] border-b border-r border-border/60 p-2.5 flex flex-col gap-1.5 transition-all duration-150",
                      di === 6 && "border-r-0",
                      isWeekend && !hasData && "bg-muted/15",
                      hasData && RESULT_BG[entry.result],
                      hasData && "cursor-pointer",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className={cn(
                        "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0",
                        isToday ? "bg-primary text-primary-foreground" : hasData ? "text-foreground" : "text-muted-foreground/50"
                      )}>
                        {day.getDate()}
                      </span>
                      {hasData && <span className={cn("w-2 h-2 rounded-full mt-0.5 shrink-0", RESULT_DOT[entry.result])} />}
                    </div>
                    {hasData && (
                      <div className="mt-auto space-y-0.5">
                        <p className={cn("text-xs font-bold tabular-nums leading-none", RESULT_TEXT[entry.result])}>
                          {fmtPnl(entry.pnl, true)}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-none">{entry.tradeCount}t</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Week summary */}
              <div className="min-h-[100px] border-b border-border/60 px-3 py-2.5 flex flex-col justify-center items-center gap-1 bg-muted/40">
                {ws.count > 0 ? (
                  <>
                    <span className={cn("text-xs font-bold tabular-nums", ws.pnl > 0 ? "text-emerald-500" : ws.pnl < 0 ? "text-rose-500" : "text-amber-500")}>
                      {fmtPnl(ws.pnl, true)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{ws.count}t</span>
                    <div className="flex gap-1 mt-0.5">
                      {ws.wins > 0 && <span className="text-[9px] font-semibold text-emerald-500">{ws.wins}W</span>}
                      {ws.losses > 0 && <span className="text-[9px] font-semibold text-rose-500">{ws.losses}L</span>}
                    </div>
                  </>
                ) : (
                  <span className="text-[11px] text-muted-foreground/40">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Win day</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />Loss day</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Breakeven</div>
      </div>

      <DayDialog day={selectedDay} open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </main>
  );
}
