"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Shuffle, Archive, ArchiveRestore, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TradeDialog } from "@/components/journal/TradeDialog";
import { TradeFilters } from "@/components/journal/TradeFilters";
import { getTrades, createTrade, updateTrade, deleteTrade, archiveTrade, restoreTrade } from "@/services/trades.service";
import { buildRandomTrade } from "@/lib/random-trade";
import type { TradesParams } from "@/types/trade";
import { getStrategies } from "@/services/strategies.service";
import type { Trade, CreateTradeInput } from "@/types/trade";

const RESULT_STYLES: Record<string, string> = {
  win:       "bg-[color-mix(in_oklch,var(--color-chart-1)_10%,transparent)] text-[var(--color-chart-1)]",
  loss:      "bg-[color-mix(in_oklch,var(--color-chart-2)_10%,transparent)] text-[var(--color-chart-2)]",
  breakeven: "bg-[color-mix(in_oklch,var(--color-chart-3)_10%,transparent)] text-[var(--color-chart-3)]",
};

const DIRECTION_STYLES: Record<string, string> = {
  long:  "bg-[color-mix(in_oklch,var(--color-chart-4)_15%,transparent)] text-[var(--color-chart-4)]",
  short: "bg-[color-mix(in_oklch,var(--color-chart-5)_15%,transparent)] text-[var(--color-chart-5)]",
};

export default function JournalPage() {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const isAdmin = status === "authenticated" && (session?.user as { role?: string })?.role === "ADMIN";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [deleting, setDeleting] = useState<Trade | null>(null);

  const [page, setPage] = useState(1);
  const [archived, setArchived] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [strategyId, setStrategyId] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "grade" | "pnl">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const params: TradesParams = { page, dateFrom, dateTo, search, sortBy, sortDir, strategyId, archived };

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["trades", page, dateFrom, dateTo, search, sortBy, sortDir, strategyId, archived],
    queryFn: () => getTrades(params),
    placeholderData: (prev) => prev,
  });

  const trades = data?.trades ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const { data: strategies = [] } = useQuery({
    queryKey: ["strategies"],
    queryFn: getStrategies,
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["trades"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    queryClient.invalidateQueries({ queryKey: ["calendar"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateTradeInput) => createTrade(input),
    onSuccess: () => {
      toast.success("Trade logged");
      invalidateAll();
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to log trade"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateTradeInput> }) =>
      updateTrade(id, input),
    onSuccess: () => {
      toast.success("Trade updated");
      invalidateAll();
      setEditing(null);
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to update trade"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTrade(id),
    onSuccess: () => {
      toast.success("Trade deleted");
      invalidateAll();
      setDeleting(null);
    },
    onError: () => toast.error("Only archived trades can be deleted."),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveTrade(id),
    onSuccess: () => {
      toast.success("Trade archived");
      invalidateAll();
    },
    onError: () => toast.error("Failed to archive trade"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreTrade(id),
    onSuccess: () => {
      toast.success("Trade restored");
      invalidateAll();
    },
    onError: () => toast.error("Failed to restore trade"),
  });

  const randomMutation = useMutation({
    mutationFn: async () => {
      for (let i = 0; i < 10; i++) {
        await createTrade(buildRandomTrade(strategies));
        if (i < 9) await new Promise((r) => setTimeout(r, 300));
      }
    },
    onSuccess: () => {
      toast.success("10 random trades logged");
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to log random trades"),
  });

  function handleSubmit(input: CreateTradeInput) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, input });
    } else {
      createMutation.mutate(input);
    }
  }

  function toggleSort(field: "date" | "grade" | "pnl") {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  }

  const clearFilters = useCallback(() => {
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setStrategyId("");
    setPage(1);
  }, []);

  const handleArchived = useCallback((v: boolean) => {
    setArchived(v);
    // Reset all filters when switching to archived view
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setStrategyId("");
    setPage(1);
  }, []);

  const handleDateFrom = useCallback((v: string) => { setDateFrom(v); setPage(1); }, []);
  const handleDateTo = useCallback((v: string) => { setDateTo(v); setPage(1); }, []);
  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleStrategyId = useCallback((v: string) => { setStrategyId(v); setPage(1); }, []);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const hasFilters = !!dateFrom || !!dateTo || !!search || !!strategyId;

  function SortIcon({ field }: { field: "date" | "grade" | "pnl" }) {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  }

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
            <p className="text-sm text-muted-foreground mt-1">Log and review your trades.</p>
          </div>
          <div className="flex items-center gap-2">
            {status === "authenticated" && isAdmin && (
              <Button variant="outline" onClick={() => randomMutation.mutate()} disabled={randomMutation.isPending || strategies.length === 0}>
                <Shuffle className="h-4 w-4" />
                {randomMutation.isPending ? "Logging..." : "Log Random"}
              </Button>
            )}
            {!archived && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }} disabled={strategies.length === 0 || createMutation.isPending || updateMutation.isPending}>
                <Plus className="h-4 w-4" />
                Log Trade
              </Button>
            )}
          </div>
        </div>

        {strategies.length === 0 && (
          <p className="text-sm text-amber-500">You need at least one strategy before logging trades.</p>
        )}

        {/* Filters */}
        <TradeFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          search={search}
          strategyId={strategyId}
          archived={archived}
          total={total}
          hasFilters={hasFilters}
          strategies={strategies}
          onDateFrom={handleDateFrom}
          onDateTo={handleDateTo}
          onSearch={handleSearch}
          onStrategyId={handleStrategyId}
          onArchived={handleArchived}
          onClear={clearFilters}
        />

        {/* Table */}
        {isLoading && !isPlaceholderData ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Spinner />
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
            <p className="text-muted-foreground">
              {archived ? "No archived trades." : hasFilters ? "No trades match your filters." : "No trades logged yet."}
            </p>
            {!hasFilters && !archived && strategies.length > 0 && (
              <Button variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4" />
                Log your first trade
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={cn("rounded-xl border border-border overflow-hidden transition-opacity", isPlaceholderData && "opacity-60")}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        <button type="button" onClick={() => toggleSort("date")}
                          className="flex items-center cursor-pointer hover:text-foreground transition-colors">
                          Date <SortIcon field="date" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Instrument</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Direction</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Result</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        <button type="button" onClick={() => toggleSort("pnl")}
                          className="flex items-center justify-end w-full cursor-pointer hover:text-foreground transition-colors">
                          P&L <SortIcon field="pnl" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Strategy</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                        <button type="button" onClick={() => toggleSort("grade")}
                          className="flex items-center cursor-pointer hover:text-foreground transition-colors">
                          Grade <SortIcon field="grade" />
                        </button>
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {trades.map((trade) => (
                      <tr key={trade.id} className={cn("hover:bg-muted/30 transition-colors", trade.archived && "opacity-60")}>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(trade.date).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium">{trade.instrument}</td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", DIRECTION_STYLES[trade.direction])}>
                            {trade.direction.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", RESULT_STYLES[trade.result])}>
                            {trade.result === "breakeven" ? "BE" : trade.result.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums"
                          style={{ color: trade.pnl > 0 ? "var(--color-chart-1)" : trade.pnl < 0 ? "var(--color-chart-2)" : undefined }}
                        >
                          {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{trade.strategy?.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{trade.grade}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {archived ? (
                              <>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => restoreMutation.mutate(trade.id)}
                                  disabled={restoreMutation.isPending}>
                                  <ArchiveRestore className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => setDeleting(trade)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="icon" variant="ghost" className="h-7 w-7"
                                  onClick={() => { setEditing(trade); setDialogOpen(true); }}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => archiveMutation.mutate(trade.id)}
                                  disabled={archiveMutation.isPending}>
                                  <Archive className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isPlaceholderData}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                      ) : (
                        <Button key={p} variant={page === p ? "default" : "outline"}
                          className="h-8 w-8" size="icon" onClick={() => setPage(p as number)}>
                          {p}
                        </Button>
                      )
                    )}
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isPlaceholderData}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <TradeDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        loading={isSaving}
        strategies={strategies}
        initial={editing ?? undefined}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        loading={deleteMutation.isPending}
        title="Delete trade"
        description="This will permanently delete the trade. This cannot be undone."
      />
    </main>
  );
}
