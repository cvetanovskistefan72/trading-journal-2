"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Shuffle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TradeDialog } from "@/components/journal/TradeDialog";
import { TradeFilters } from "@/components/journal/TradeFilters";
import { DataTable } from "@/components/data-table";
import { TradeCards } from "@/components/journal/TradeCards";
import { journalColumns } from "./columns";
import type { JournalMeta } from "./columns";
import { useJournalDensity } from "@/hooks/useJournalDensity";
import { getTrades, createTrade, updateTrade, deleteTrade, archiveTrade, restoreTrade } from "@/services/trades.service";
import { buildRandomTrade } from "@/lib/random-trade";
import type { TradesParams, Trade, CreateTradeInput } from "@/types/trade";
import { getStrategies } from "@/services/strategies.service";

export default function JournalPage() {
  const density = useJournalDensity();
  const limit = density === "cards" ? 9 : 10;
  const prevDensity = useRef(density);
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

  useEffect(() => {
    if (prevDensity.current !== density) {
      prevDensity.current = density;
      setPage(1);
      setDateFrom("");
      setDateTo("");
      setSearch("");
      setStrategyId("");
    }
  }, [density]);

  const params: TradesParams = {
    page, limit, dateFrom, dateTo, search, strategyId, archived,
    sortBy: density === "cards" ? "date" : sortBy,
    sortDir: density === "cards" ? "desc" : sortDir,
  };

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["trades", page, limit, dateFrom, dateTo, search, density === "cards" ? "date" : sortBy, density === "cards" ? "desc" : sortDir, strategyId, archived],
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
    onSuccess: () => { toast.success("Trade logged"); invalidateAll(); setDialogOpen(false); },
    onError: () => toast.error("Failed to log trade"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateTradeInput> }) => updateTrade(id, input),
    onSuccess: () => { toast.success("Trade updated"); invalidateAll(); setEditing(null); setDialogOpen(false); },
    onError: () => toast.error("Failed to update trade"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTrade(id),
    onSuccess: () => { toast.success("Trade deleted"); invalidateAll(); setDeleting(null); },
    onError: () => toast.error("Only archived trades can be deleted."),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveTrade(id),
    onSuccess: () => { toast.success("Trade archived"); invalidateAll(); },
    onError: () => toast.error("Failed to archive trade"),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreTrade(id),
    onSuccess: () => { toast.success("Trade restored"); invalidateAll(); },
    onError: () => toast.error("Failed to restore trade"),
  });

  const randomMutation = useMutation({
    mutationFn: async () => {
      for (let i = 0; i < 10; i++) {
        await createTrade(buildRandomTrade(strategies));
        if (i < 9) await new Promise((r) => setTimeout(r, 300));
      }
    },
    onSuccess: () => { toast.success("10 random trades logged"); invalidateAll(); },
    onError: (e: Error) => toast.error(e.message || "Failed to log random trades"),
  });

  function handleSubmit(input: CreateTradeInput) {
    if (editing) updateMutation.mutate({ id: editing.id, input });
    else createMutation.mutate(input);
  }

  function toggleSort(field: "date" | "grade" | "pnl") {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("desc"); }
    setPage(1);
  }

  const clearFilters = useCallback(() => { setDateFrom(""); setDateTo(""); setSearch(""); setStrategyId(""); setPage(1); }, []);
  const handleArchived = useCallback((v: boolean) => { setArchived(v); setDateFrom(""); setDateTo(""); setSearch(""); setStrategyId(""); setPage(1); }, []);
  const handleDateFrom = useCallback((v: string) => { setDateFrom(v); setPage(1); }, []);
  const handleDateTo = useCallback((v: string) => { setDateTo(v); setPage(1); }, []);
  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleStrategyId = useCallback((v: string) => { setStrategyId(v); setPage(1); }, []);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const hasFilters = !!dateFrom || !!dateTo || !!search || !!strategyId;

  const meta: JournalMeta = {
    archived,
    onEdit: (trade) => { setEditing(trade); setDialogOpen(true); },
    onDelete: (trade) => setDeleting(trade),
    onArchive: (id) => archiveMutation.mutate(id),
    onRestore: (id) => restoreMutation.mutate(id),
    archivePending: archiveMutation.isPending,
    restorePending: restoreMutation.isPending,
    toggleSort,
    sortBy,
    sortDir,
  };

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
      <div className="space-y-6">

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
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }} disabled={strategies.length === 0 || isSaving}>
                <Plus className="h-4 w-4" />
                Log Trade
              </Button>
            )}
          </div>
        </div>

        {strategies.length === 0 && (
          <p className="text-sm text-amber-500">You need at least one strategy before logging trades.</p>
        )}

        <TradeFilters
          dateFrom={dateFrom} dateTo={dateTo} search={search} strategyId={strategyId}
          archived={archived} total={total} hasFilters={hasFilters} strategies={strategies}
          onDateFrom={handleDateFrom} onDateTo={handleDateTo} onSearch={handleSearch}
          onStrategyId={handleStrategyId} onArchived={handleArchived} onClear={clearFilters}
        />

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
                <Plus className="h-4 w-4" /> Log your first trade
              </Button>
            )}
          </div>
        ) : (
          <>
            {density === "cards" ? (
              <TradeCards
                trades={trades}
                archived={archived}
                archivePending={archiveMutation.isPending}
                restorePending={restoreMutation.isPending}
                onEdit={(trade) => { setEditing(trade); setDialogOpen(true); }}
                onDelete={(trade) => setDeleting(trade)}
                onArchive={(id) => archiveMutation.mutate(id)}
                onRestore={(id) => restoreMutation.mutate(id)}
              />
            ) : (
              <DataTable
                columns={journalColumns}
                data={trades}
                meta={meta as unknown as Record<string, unknown>}
                isPlaceholderData={isPlaceholderData}
                rowClassName={(trade) => trade.archived ? "opacity-60" : ""}
              />
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
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
