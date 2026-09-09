"use client";

import { Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Trade } from "@/types/trade";

const RESULT_STYLES: Record<string, string> = {
  win:       "bg-[color-mix(in_oklch,var(--color-chart-1)_12%,transparent)] text-[var(--color-chart-1)]",
  loss:      "bg-[color-mix(in_oklch,var(--color-chart-2)_12%,transparent)] text-[var(--color-chart-2)]",
  breakeven: "bg-[color-mix(in_oklch,var(--color-chart-3)_12%,transparent)] text-[var(--color-chart-3)]",
};

const DIRECTION_STYLES: Record<string, string> = {
  long:  "bg-[color-mix(in_oklch,var(--color-chart-4)_15%,transparent)] text-[var(--color-chart-4)]",
  short: "bg-[color-mix(in_oklch,var(--color-chart-5)_15%,transparent)] text-[var(--color-chart-5)]",
};

type Props = {
  trades: Trade[];
  archived: boolean;
  archivePending: boolean;
  restorePending: boolean;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
};

export function TradeCards({ trades, archived, archivePending, restorePending, onEdit, onDelete, onArchive, onRestore }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {trades.map((trade) => (
        <div
          key={trade.id}
          className={cn(
            "rounded-xl border border-border bg-card p-4 flex flex-col gap-3",
            trade.archived && "opacity-60"
          )}
        >
          {/* Top row: date + actions */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground tabular-nums">
              {new Date(trade.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <div className="flex items-center gap-0.5">
              {archived ? (
                <>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => onRestore(trade.id)} disabled={restorePending}>
                    <ArchiveRestore className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => onDelete(trade)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="icon" variant="ghost" className="h-6 w-6"
                    onClick={() => onEdit(trade)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => onArchive(trade.id)} disabled={archivePending}>
                    <Archive className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Instrument + direction + result */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{trade.instrument}</span>
            <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase", DIRECTION_STYLES[trade.direction])}>
              {trade.direction}
            </span>
            <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase", RESULT_STYLES[trade.result])}>
              {trade.result === "breakeven" ? "BE" : trade.result}
            </span>
          </div>

          {/* P&L */}
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: trade.pnl > 0 ? "var(--color-chart-1)" : trade.pnl < 0 ? "var(--color-chart-2)" : "var(--color-chart-3)" }}
          >
            {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
          </p>

          {/* Footer: strategy + grade */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="text-xs text-muted-foreground truncate">{trade.strategy?.name ?? "—"}</span>
            <span className="text-xs font-semibold bg-muted rounded px-2 py-0.5 shrink-0 ml-2">{trade.grade}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
