"use client";

import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPnl, RESULT_TEXT, RESULT_BORDER, DIRECTION_BADGE } from "@/lib/calendar";
import type { CalendarTrade } from "@/types/calendar";

function StatPill({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">{label}</span>
      <span className={cn("text-sm font-bold tabular-nums leading-none", valueClass)}>{value}</span>
    </div>
  );
}

export function TradeCard({ trade }: { trade: CalendarTrade }) {
  const rMultiple = trade.riskAmount > 0 ? trade.pnl / trade.riskAmount : null;

  // Calculate hold time
  const [eh, em] = trade.entryTime.split(":").map(Number);
  const [xh, xm] = trade.exitTime.split(":").map(Number);
  const entryMins = eh * 60 + em;
  const exitMins = xh * 60 + xm;
  const holdMins = exitMins >= entryMins ? exitMins - entryMins : exitMins - entryMins + 24 * 60;
  const holdLabel = holdMins < 60
    ? `${holdMins}m`
    : `${Math.floor(holdMins / 60)}h ${holdMins % 60 > 0 ? `${holdMins % 60}m` : ""}`.trim();

  return (
    <div className={cn("rounded-xl border overflow-hidden", RESULT_BORDER[trade.result])}
      style={{
        backgroundColor:
          trade.result === "win"       ? "color-mix(in oklch, var(--chart-1) 5%, transparent)"  :
          trade.result === "loss"      ? "color-mix(in oklch, var(--chart-2) 4%, transparent)"  :
                                         "color-mix(in oklch, var(--chart-3) 5%, transparent)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {trade.direction === "long"
            ? <TrendingUp className="h-4 w-4 shrink-0" style={{ color: "var(--color-chart-4)" }} />
            : <TrendingDown className="h-4 w-4 shrink-0" style={{ color: "var(--color-chart-5)" }} />
          }
          <span className="font-bold text-base">{trade.instrument}</span>
          <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide shrink-0", DIRECTION_BADGE[trade.direction])}>
            {trade.direction}
          </span>
          <span className="text-xs text-muted-foreground truncate">{trade.session}</span>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className={cn("text-lg font-bold tabular-nums leading-none", RESULT_TEXT[trade.result])}>
            {fmtPnl(trade.pnl)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 px-4 pb-3 border-b border-border/50">
        <StatPill
          label="Risk"
          value={`$${trade.riskAmount.toFixed(0)}`}
        />
        <StatPill
          label="R Multiple"
          value={rMultiple !== null ? `${rMultiple >= 0 ? "+" : ""}${rMultiple.toFixed(2)}R` : "—"}
          valueClass={rMultiple !== null ? rMultiple >= 0 ? "text-[var(--color-chart-1)]" : "text-[var(--color-chart-2)]" : undefined}
        />
        <StatPill
          label="Hold"
          value={holdLabel}
        />
        <StatPill
          label="Grade"
          value={trade.grade}
          valueClass="text-foreground"
        />
      </div>

      {/* Strategy + time */}
      <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground">
        <span className="font-medium truncate">{trade.strategyName}</span>
        <span className="flex items-center gap-1 shrink-0 ml-3">
          <Clock className="h-3 w-3" />
          {trade.entryTime} – {trade.exitTime}
        </span>
      </div>

      {/* Confluences */}
      {trade.confluences.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {trade.confluences.map((c) => (
            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="mx-4 mb-3 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 leading-relaxed">
          {trade.notes}
        </div>
      )}

    </div>
  );
}
