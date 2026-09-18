"use client";

import { cn } from "@/lib/utils";
import { useEconomicCalendar } from "@/hooks/useEconomicCalendar";
import type { EconomicEvent } from "@/services/economicCalendar.service";

const IMPACT: Record<string, { dot: string; label: string }> = {
  High:   { dot: "bg-rose-500",            label: "text-rose-400"  },
  Medium: { dot: "bg-amber-400",           label: "text-amber-400" },
  Low:    { dot: "bg-muted-foreground/35", label: "text-muted-foreground/50" },
};

function fmtTime(dateStr: string) {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getStatus(dateStr: string): "past" | "soon" | "upcoming" {
  const now = Date.now();
  const evt = new Date(dateStr).getTime();
  const diff = evt - now;
  if (diff < 0) return "past";
  if (diff < 30 * 60 * 1000) return "soon";
  return "upcoming";
}

function DataRow({ label, value, highlight }: { label: string; value: string | null; highlight?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wide">{label}</span>
      {value
        ? <span className={cn("text-[11px] tabular-nums font-medium", highlight ?? "text-muted-foreground")}>{value}</span>
        : <span className="text-[11px] text-muted-foreground/25">—</span>
      }
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col px-4 py-3.5 gap-2.5 animate-pulse">
      <div className="h-3 w-16 bg-muted rounded" />
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="flex flex-col gap-1 mt-auto">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
      </div>
    </div>
  );
}

export function EconomicCalendar() {
  const { data: events = [], isLoading } = useEconomicCalendar();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="rounded-lg border border-border bg-card card-shadow overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Economic Calendar</p>
          <span className="text-[11px] text-muted-foreground/50">{today}</span>
        </div>
        <div className="flex items-center gap-3">
          {(["High", "Medium", "Low"] as const).map((lvl) => (
            <span key={lvl} className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <span className={cn("w-1.5 h-1.5 rounded-full", IMPACT[lvl].dot)} />
              {lvl === "High" ? "High" : lvl === "Medium" ? "Med" : "Low"}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-border">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="flex items-center justify-center px-5 py-8 text-sm text-muted-foreground/50 italic">
          No USD events today
        </div>
      ) : (
        <div className="grid divide-x divide-border" style={{ gridTemplateColumns: `repeat(${Math.min(events.length, 6)}, 1fr)` }}>
          {events.slice(0, 6).map((ev: EconomicEvent, i: number) => {
            const status = getStatus(ev.date);
            const imp = IMPACT[ev.impact] ?? IMPACT.Low;
            const released = ev.actual !== "" && ev.actual != null;

            return (
              <div
                key={i}
                className={cn(
                  "flex flex-col px-4 py-3.5 gap-2.5 transition-colors",
                  status === "past" ? "opacity-40" : status === "soon" ? "bg-amber-500/5" : ""
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-px", imp.dot)} />
                  <span className="text-[10px] font-semibold tabular-nums text-muted-foreground leading-none">
                    {fmtTime(ev.date)}
                  </span>
                  {status === "soon" && (
                    <span className="ml-auto text-[9px] font-bold text-amber-400 animate-pulse">SOON</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground leading-snug min-h-[32px] line-clamp-2">
                  {ev.title}
                </p>
                <div className="flex flex-col gap-1 mt-auto">
                  <DataRow label="Fcst" value={ev.forecast || null} />
                  <DataRow label="Prev" value={ev.previous || null} />
                  <DataRow
                    label="Act"
                    value={released ? ev.actual : null}
                    highlight={released ? imp.label : undefined}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
