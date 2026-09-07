"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPnl, RESULT_DOT, RESULT_TEXT, RESULT_BORDER } from "@/lib/calendar";
import type { CalendarTrade } from "@/types/calendar";

export function TradeCard({ trade }: { trade: CalendarTrade }) {
  return (
    <div className={cn(
      "rounded-xl border p-4 space-y-3 transition-colors",
      RESULT_BORDER[trade.result],
      trade.result === "win" && "bg-emerald-500/5",
      trade.result === "loss" && "bg-rose-400/4",
      trade.result === "breakeven" && "bg-amber-400/5",
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={cn("w-2 h-2 rounded-full shrink-0", RESULT_DOT[trade.result])} />
          <span className="font-semibold text-sm">{trade.instrument}</span>
          <span className={cn(
            "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide",
            trade.direction === "long" ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"
          )}>
            {trade.direction}
          </span>
          <span className="text-xs text-muted-foreground">{trade.session}</span>
        </div>
        <span className={cn("text-sm font-bold tabular-nums", RESULT_TEXT[trade.result])}>
          {fmtPnl(trade.pnl)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {trade.entryTime} – {trade.exitTime}
        </span>
        <span>{trade.strategyName}</span>
        <span className="ml-auto font-semibold text-foreground">{trade.grade}</span>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">
          Risk <span className="text-foreground font-medium">${trade.riskAmount.toFixed(0)}</span>
        </span>
        {trade.riskAmount > 0 && (
          <span className="text-muted-foreground">
            R:R <span className={cn("font-medium", RESULT_TEXT[trade.result])}>
              {(trade.pnl / trade.riskAmount).toFixed(2)}R
            </span>
          </span>
        )}
      </div>

      {trade.notes && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 leading-relaxed">
          {trade.notes}
        </p>
      )}
    </div>
  );
}
