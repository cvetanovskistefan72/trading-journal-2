"use client";

import { useEffect, useState } from "react";
import { Search, X, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Strategy } from "@/types/strategy";

type Props = {
  dateFrom: string;
  dateTo: string;
  search: string;
  strategyId: string;
  archived: boolean;
  total: number;
  hasFilters: boolean;
  strategies: Strategy[];
  onDateFrom: (v: string) => void;
  onDateTo: (v: string) => void;
  onSearch: (v: string) => void;
  onStrategyId: (v: string) => void;
  onArchived: (v: boolean) => void;
  onClear: () => void;
};

export function TradeFilters({
  dateFrom, dateTo, search, strategyId, archived, total, hasFilters, strategies = [],
  onDateFrom, onDateTo, onSearch, onStrategyId, onArchived, onClear,
}: Props) {
  const [searchInput, setSearchInput] = useState(search);

  // Debounce search — intentionally omit onSearch from deps to avoid re-firing on every parent render
  useEffect(() => {
    const t = setTimeout(() => onSearch(searchInput), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Sync if cleared externally
  useEffect(() => {
    if (!search) setSearchInput("");
  }, [search]);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-end gap-3 px-4 py-3 border-b border-border/50">

        {/* Archived toggle */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">View</p>
          <div className="flex rounded-lg border border-border overflow-hidden h-8">
            <button
              type="button"
              onClick={() => onArchived(false)}
              className={cn(
                "px-3 text-xs font-medium transition-colors cursor-pointer",
                !archived ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => onArchived(true)}
              className={cn(
                "px-3 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 border-l border-border",
                archived ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Archive className="h-3 w-3" />
              Archived
            </button>
          </div>
        </div>

        {/* Search — hidden when archived */}
        {!archived && (
          <div className="space-y-1 min-w-44 w-56">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Search</p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Instrument, notes..."
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
        )}

        {/* Strategy filter — hidden when archived */}
        {!archived && strategies.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Strategy</p>
            <Select value={strategyId || "__all__"} onValueChange={(v) => onStrategyId(v === "__all__" ? "" : v)}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="All strategies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All strategies</SelectItem>
                {strategies.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date From — hidden when archived */}
        {!archived && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">From</p>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFrom(e.target.value)}
              className="h-8 w-36 text-sm"
            />
          </div>
        )}

        {/* Date To — hidden when archived */}
        {!archived && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">To</p>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateTo(e.target.value)}
              className="h-8 w-36 text-sm"
            />
          </div>
        )}

        {/* Clear */}
        {hasFilters && !archived && (
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5 self-end">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center px-4 py-2">
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span>{" "}
          {archived ? "archived" : "active"} trade{total !== 1 ? "s" : ""}
          {hasFilters && !archived ? " found" : ""}
        </span>
      </div>
    </div>
  );
}
