"use client";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  const date = new Date(day.date + "T12:00:00");
  const label = date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-base leading-snug">{label}</DialogTitle>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span>{day.tradeCount} trade{day.tradeCount !== 1 ? "s" : ""}</span>
                {wins > 0 && <span className="text-emerald-500 font-medium">{wins}W</span>}
                {losses > 0 && <span className="text-rose-500 font-medium">{losses}L</span>}
                {bes > 0 && <span className="text-amber-500 font-medium">{bes}BE</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={cn("text-xl font-bold tabular-nums", RESULT_TEXT[day.result])}>
                {fmtPnl(day.pnl)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Net P&L</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {day.trades.map(trade => (
            <TradeCard key={trade.id} trade={trade} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
