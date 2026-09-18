"use client";

import { useRouter } from "next/navigation";
import { Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Trade } from "@/types/trade";

const RESULT_COLOR: Record<string, string> = {
  win:       "var(--color-chart-1)",
  loss:      "var(--color-chart-2)",
  breakeven: "var(--color-chart-3)",
};

const DIRECTION_LABEL: Record<string, string> = { long: "Long", short: "Short" };
const RESULT_LABEL: Record<string, string> = { win: "Win", loss: "Loss", breakeven: "BE" };

const DIRECTION_CLS: Record<string, string> = {
  long:  "text-[var(--color-chart-4)]",
  short: "text-[var(--color-chart-5)]",
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

export function TradeCards({ trades, archivePending, restorePending, onEdit, onDelete, onArchive, onRestore }: Props) {
  const router = useRouter();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
      {trades.map((trade) => {
        const resultColor = RESULT_COLOR[trade.result];
        const isArchived = trade.archived;
        return (
          <div
            key={trade.id}
            onClick={() => !isArchived && router.push(`/journal/${trade.id}`)}
            style={{ cursor: isArchived ? "default" : "pointer" }}
            className={cn(
              "rounded-lg border border-border bg-card card-shadow flex flex-col transition-colors overflow-hidden group",
              !isArchived && "hover:bg-muted/20",
              isArchived && "opacity-50"
            )}
          >
            {/* Main content */}
            <div className="flex items-start gap-4 px-4 pt-4 pb-3">
              {/* Colored bar */}
              <div className="w-[3px] self-stretch rounded-full shrink-0" style={{ backgroundColor: resultColor }} />

              {/* Body */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tracking-tight">{trade.instrument}</span>
                    <span className={cn("text-xs font-semibold", DIRECTION_CLS[trade.direction])}>
                      {DIRECTION_LABEL[trade.direction]}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: resultColor }}>
                      {RESULT_LABEL[trade.result]}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isArchived ? (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => onRestore(trade.id)} disabled={restorePending}>
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onDelete(trade)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onEdit(trade)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
                          onClick={() => onArchive(trade.id)} disabled={archivePending}>
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* P&L — big */}
                <p className="text-2xl font-bold tabular-nums leading-none" style={{ color: resultColor }}>
                  {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-border bg-muted/20">
              <span className="text-xs text-muted-foreground truncate">{trade.strategy?.name ?? "—"}</span>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {new Date(trade.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                </span>
                <span className="text-[11px] font-semibold bg-muted rounded px-1.5 py-0.5 tabular-nums">{trade.grade}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
