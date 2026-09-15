"use client";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fmtPnl, RESULT_TEXT } from "@/lib/calendar";
import { TradeCard } from "./TradeCard";
import type { CalendarDay } from "@/types/calendar";

export function DayDialog({
  day,
  open,
  onClose,
}: {
  day: CalendarDay | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!day) return null;

  const wins = day.trades.filter(t => t.result === "win").length;
  const losses = day.trades.filter(t => t.result === "loss").length;
  const bes = day.trades.filter(t => t.result === "breakeven").length;

  const totalRisk = day.trades.reduce((s, t) => s + t.riskAmount, 0);
  const rMultiples = day.trades
    .filter(t => t.riskAmount > 0)
    .map(t => t.pnl / t.riskAmount);
  const avgR = rMultiples.length > 0
    ? rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length
    : null;

  const date = new Date(day.date + "T12:00:00");
  const label = date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-base leading-snug truncate">{label}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {day.tradeCount} trade{day.tradeCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={cn("text-2xl font-bold tabular-nums leading-none", RESULT_TEXT[day.result])}>
                {fmtPnl(day.pnl)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">Net P&amp;L</p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="rounded-lg bg-muted/50 px-3 py-2 flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Win</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 shrink-0" style={{ color: "var(--color-chart-1)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--color-chart-1)" }}>{wins}</span>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2 flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Loss</span>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 shrink-0" style={{ color: "var(--color-chart-2)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--color-chart-2)" }}>{losses}</span>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2 flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Avg R</span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: avgR !== null ? avgR >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)" : undefined }}
              >
                {avgR !== null ? `${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R` : "—"}
              </span>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2 flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Risk</span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                ${totalRisk.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Trade list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {day.trades.map(trade => (
            <TradeCard key={trade.id} trade={trade} onNavigate={onClose} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
