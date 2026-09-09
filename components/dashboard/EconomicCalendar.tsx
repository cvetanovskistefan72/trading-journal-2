"use client";

import { cn } from "@/lib/utils";

const FAKE_EVENTS = [
  { time: "08:30", title: "Core CPI m/m",         impact: "high"   as const, forecast: "0.2%",  actual: "-0.1%", previous: "0.3%" },
  { time: "08:30", title: "CPI m/m",              impact: "high"   as const, forecast: "0.3%",  actual: "0.2%",  previous: "0.4%" },
  { time: "10:00", title: "ISM Services PMI",     impact: "medium" as const, forecast: "51.4",  actual: null,    previous: "50.8" },
  { time: "10:00", title: "FOMC Minutes",         impact: "high"   as const, forecast: null,    actual: null,    previous: null   },
  { time: "14:30", title: "Crude Oil Inventories",impact: "medium" as const, forecast: "-1.2M", actual: null,    previous: "-2.0M"},
  { time: "16:00", title: "30-Y Bond Auction",    impact: "low"    as const, forecast: null,    actual: null,    previous: null   },
];

const IMPACT = {
  high:   { dot: "bg-rose-500",           label: "text-rose-400"  },
  medium: { dot: "bg-amber-400",          label: "text-amber-400" },
  low:    { dot: "bg-muted-foreground/35",label: "text-muted-foreground/50" },
};

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${String(m).padStart(2, "0")} ${suffix}`;
}

function getStatus(time: string): "past" | "soon" | "upcoming" {
  const now = new Date();
  const [h, m] = time.split(":").map(Number);
  const evt = new Date(now);
  evt.setHours(h, m, 0, 0);
  const diff = evt.getTime() - now.getTime();
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

export function EconomicCalendar() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Economic Calendar</p>
          <span className="text-[11px] text-muted-foreground/50">{today}</span>
        </div>
        <div className="flex items-center gap-3">
          {(["high", "medium", "low"] as const).map((lvl) => (
            <span key={lvl} className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
              <span className={cn("w-1.5 h-1.5 rounded-full", IMPACT[lvl].dot)} />
              {lvl === "high" ? "High" : lvl === "medium" ? "Med" : "Low"}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground/30 italic ml-1">demo</span>
        </div>
      </div>

      {/* Events */}
      <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-border">
        {FAKE_EVENTS.map((ev, i) => {
          const status = getStatus(ev.time);
          const imp = IMPACT[ev.impact];
          const released = ev.actual !== null;

          return (
            <div
              key={i}
              className={cn(
                "flex flex-col px-4 py-3.5 gap-2.5 transition-colors",
                status === "past" ? "opacity-40" : status === "soon" ? "bg-amber-500/5" : ""
              )}
            >
              {/* Time + dot */}
              <div className="flex items-center gap-1.5">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-px", imp.dot)} />
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground leading-none">
                  {fmtTime(ev.time)}
                </span>
                {status === "soon" && (
                  <span className="ml-auto text-[9px] font-bold text-amber-400 animate-pulse">SOON</span>
                )}
              </div>

              {/* Title */}
              <p className="text-xs font-semibold text-foreground leading-snug min-h-[32px] line-clamp-2">
                {ev.title}
              </p>

              {/* Always 3 rows — Fcst / Prev / Act — so all cards same height */}
              <div className="flex flex-col gap-1 mt-auto">
                <DataRow label="Fcst" value={ev.forecast} />
                <DataRow label="Prev" value={ev.previous} />
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
    </div>
  );
}
