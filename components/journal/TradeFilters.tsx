"use client";

import { useEffect, useState } from "react";
import { Search, X, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Strategy } from "@/types/strategy";

type Props = {
  dateFrom: string;
  dateTo: string;
  search: string;
  strategyId: string;
  direction: string;
  archived: boolean;
  total: number;
  hasFilters: boolean;
  strategies: Strategy[];
  onDateFrom: (v: string) => void;
  onDateTo: (v: string) => void;
  onSearch: (v: string) => void;
  onStrategyId: (v: string) => void;
  onDirection: (v: string) => void;
  onArchived: (v: boolean) => void;
  onClear: () => void;
};

export function TradeFilters({
  dateFrom, dateTo, search, strategyId, direction, archived, total, hasFilters, strategies = [],
  onDateFrom, onDateTo, onSearch, onStrategyId, onDirection, onArchived, onClear,
}: Props) {
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => onSearch(searchInput), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    if (!search) setSearchInput("");
  }, [search]);

  return (
    <>
      {/* Top bar — same bg as table header */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-muted/40 border-b border-border">

        {/* View toggle */}
        <div className="flex rounded-md border border-border overflow-hidden h-7 shrink-0">
          <button
            type="button"
            onClick={() => onArchived(false)}
            className={cn(
              "px-3 text-[11px] font-semibold transition-colors cursor-pointer",
              !archived ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => onArchived(true)}
            className={cn(
              "px-3 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 border-l border-border",
              archived ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Archive className="h-3 w-3" />
            Archived
          </button>
        </div>

        {/* Inline filters — always visible, hidden when archived */}
        {!archived && (
          <>
            <div className="h-4 w-px bg-border shrink-0" />

            {/* Search */}
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Instrument, notes…"
                className="h-7 pl-8 text-xs bg-background/60 border-border/60"
              />
            </div>

            {/* Strategy */}
            {strategies.length > 0 && (
              <Select value={strategyId || "__all__"} onValueChange={(v) => onStrategyId(v === "__all__" ? "" : v)}>
                <SelectTrigger className="h-7 w-40 text-xs bg-background/60 border-border/60">
                  <SelectValue placeholder="All strategies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All strategies</SelectItem>
                  {strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Direction */}
            <Select value={direction || "__all__"} onValueChange={(v) => onDirection(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-7 w-28 text-xs bg-background/60 border-border/60">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All directions</SelectItem>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-4 w-px bg-border shrink-0" />

            {/* Date range */}
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFrom(e.target.value)}
              className="h-7 w-36 text-xs bg-background/60 border-border/60"
            />
            <span className="text-[10px] text-muted-foreground shrink-0">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateTo(e.target.value)}
              className="h-7 w-36 text-xs bg-background/60 border-border/60"
            />

            {/* Clear */}
            {hasFilters && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </>
        )}

        {/* Trade count — right */}
        <span className="ml-auto text-xs text-muted-foreground shrink-0">
          <span className="font-semibold text-foreground tabular-nums">{total}</span>{" "}
          {archived ? "archived" : "active"} trade{total !== 1 ? "s" : ""}
          {hasFilters && !archived ? " found" : ""}
        </span>
      </div>
    </>
  );
}
