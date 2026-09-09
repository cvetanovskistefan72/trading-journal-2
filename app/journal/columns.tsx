"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, Archive, ArchiveRestore, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Trade } from "@/types/trade";

const RESULT_STYLES: Record<string, string> = {
  win:       "bg-[color-mix(in_oklch,var(--color-chart-1)_10%,transparent)] text-[var(--color-chart-1)]",
  loss:      "bg-[color-mix(in_oklch,var(--color-chart-2)_10%,transparent)] text-[var(--color-chart-2)]",
  breakeven: "bg-[color-mix(in_oklch,var(--color-chart-3)_10%,transparent)] text-[var(--color-chart-3)]",
};

const DIRECTION_STYLES: Record<string, string> = {
  long:  "bg-[color-mix(in_oklch,var(--color-chart-4)_15%,transparent)] text-[var(--color-chart-4)]",
  short: "bg-[color-mix(in_oklch,var(--color-chart-5)_15%,transparent)] text-[var(--color-chart-5)]",
};

export type JournalMeta = {
  archived: boolean;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  archivePending: boolean;
  restorePending: boolean;
  toggleSort: (field: "date" | "grade" | "pnl") => void;
  sortBy: "date" | "grade" | "pnl";
  sortDir: "asc" | "desc";
};

function SortIcon({ field, sortBy, sortDir }: { field: "date" | "grade" | "pnl"; sortBy: string; sortDir: string }) {
  if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
}

export const journalColumns: ColumnDef<Trade>[] = [
  {
    accessorKey: "date",
    header: ({ table }) => {
      const meta = table.options.meta as JournalMeta;
      return (
        <button type="button" onClick={() => meta.toggleSort("date")}
          className="flex items-center cursor-pointer hover:text-foreground transition-colors">
          Date <SortIcon field="date" sortBy={meta.sortBy} sortDir={meta.sortDir} />
        </button>
      );
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {new Date(row.original.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      </span>
    ),
  },
  {
    accessorKey: "instrument",
    header: "Instrument",
    cell: ({ row }) => <span className="font-medium">{row.original.instrument}</span>,
  },
  {
    accessorKey: "direction",
    header: "Direction",
    cell: ({ row }) => (
      <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", DIRECTION_STYLES[row.original.direction])}>
        {row.original.direction.toUpperCase()}
      </span>
    ),
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => (
      <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", RESULT_STYLES[row.original.result])}>
        {row.original.result === "breakeven" ? "BE" : row.original.result.toUpperCase()}
      </span>
    ),
  },
  {
    accessorKey: "pnl",
    header: ({ table }) => {
      const meta = table.options.meta as JournalMeta;
      return (
        <button type="button" onClick={() => meta.toggleSort("pnl")}
          className="flex items-center justify-end w-full cursor-pointer hover:text-foreground transition-colors">
          P&L <SortIcon field="pnl" sortBy={meta.sortBy} sortDir={meta.sortDir} />
        </button>
      );
    },
    cell: ({ row }) => (
      <span
        className="text-right font-medium tabular-nums block"
        style={{ color: row.original.pnl > 0 ? "var(--color-chart-1)" : row.original.pnl < 0 ? "var(--color-chart-2)" : undefined }}
      >
        {row.original.pnl >= 0 ? "+" : ""}${row.original.pnl.toFixed(2)}
      </span>
    ),
  },
  {
    id: "strategy",
    header: "Strategy",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.strategy?.name ?? "—"}</span>,
  },
  {
    accessorKey: "grade",
    header: ({ table }) => {
      const meta = table.options.meta as JournalMeta;
      return (
        <button type="button" onClick={() => meta.toggleSort("grade")}
          className="flex items-center cursor-pointer hover:text-foreground transition-colors">
          Grade <SortIcon field="grade" sortBy={meta.sortBy} sortDir={meta.sortDir} />
        </button>
      );
    },
    cell: ({ row }) => (
      <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{row.original.grade}</span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const meta = table.options.meta as JournalMeta;
      const trade = row.original;
      return (
        <div className="flex items-center gap-1 justify-end">
          {meta.archived ? (
            <>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => meta.onRestore(trade.id)} disabled={meta.restorePending}>
                <ArchiveRestore className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => meta.onDelete(trade)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="ghost" className="h-7 w-7"
                onClick={() => meta.onEdit(trade)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => meta.onArchive(trade.id)} disabled={meta.archivePending}>
                <Archive className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      );
    },
  },
];
