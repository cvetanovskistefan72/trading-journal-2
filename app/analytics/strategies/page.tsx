"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, BookMarked } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StrategyDialog } from "@/components/strategy/StrategyDialog";
import { StrategyDetailSheet } from "@/components/strategy/StrategyDetailSheet";
import {
  getStrategies,
  createStrategy,
  updateStrategy,
  deleteStrategy,
} from "@/services/strategies.service";
import type { Strategy, CreateStrategyInput } from "@/types/strategy";

export default function StrategiesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Strategy | null>(null);
  const [deleting, setDeleting] = useState<Strategy | null>(null);
  const [viewing, setViewing] = useState<Strategy | null>(null);

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ["strategies"],
    queryFn: getStrategies,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateStrategyInput) => createStrategy(input),
    onSuccess: () => {
      toast.success("Strategy created");
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to create strategy"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateStrategyInput }) =>
      updateStrategy(id, input),
    onSuccess: () => {
      toast.success("Strategy updated");
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      setEditing(null);
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to update strategy"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStrategy(id),
    onSuccess: () => {
      toast.success("Strategy deleted");
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      setDeleting(null);
      setViewing(null);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Failed to delete strategy");
    },
  });

  function handleSubmit(input: CreateStrategyInput) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, input });
    } else {
      createMutation.mutate(input);
    }
  }

  function handleEdit(strategy: Strategy) {
    setViewing(null);
    setEditing(strategy);
    setDialogOpen(true);
  }

  function handleDelete(strategy: Strategy) {
    setViewing(null);
    setDeleting(strategy);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Strategies</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your trading setups, confluences and post-trade questions.
            </p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            New strategy
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Spinner />
          </div>
        ) : strategies.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
            <p className="text-muted-foreground">No strategies yet.</p>
            <Button variant="outline" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Create your first strategy
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {strategies.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onClick={() => setViewing(strategy)}
                onEdit={() => handleEdit(strategy)}
                onDelete={() => handleDelete(strategy)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail sheet */}
      <StrategyDetailSheet
        strategy={viewing}
        onClose={() => setViewing(null)}
      />

      {/* Create / Edit dialog */}
      <StrategyDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        loading={isSaving}
        initial={editing ?? undefined}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        loading={deleteMutation.isPending}
        title="Delete strategy"
        description={`Are you sure you want to delete "${deleting?.name}"? This cannot be undone.`}
      />
    </main>
  );
}

function StrategyCard({
  strategy,
  onClick,
  onEdit,
  onDelete,
}: {
  strategy: Strategy;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const visibleConfluences = strategy.confluences.slice(0, 5);
  const extraConfluences = strategy.confluences.length - visibleConfluences.length;

  return (
    <div
      className="rounded-lg border border-border bg-card card-shadow flex flex-col cursor-pointer hover:border-border/60 hover:shadow-md transition-all group overflow-hidden"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center bg-[color-mix(in_oklch,var(--color-chart-1)_10%,transparent)]">
            <BookMarked className="h-3.5 w-3.5 text-[var(--color-chart-1)]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">{strategy.name}</h3>
            {strategy.description ? (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{strategy.description}</p>
            ) : (
              <p className="text-xs text-muted-foreground/30 mt-0.5">No description</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} className="cursor-pointer p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="cursor-pointer p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-[var(--color-chart-2)] transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Confluences */}
      {strategy.confluences.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {visibleConfluences.map((c) => (
            <span key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground truncate max-w-40">
              {c}
            </span>
          ))}
          {extraConfluences > 0 && (
            <span className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground">
              +{extraConfluences}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-muted/20 mt-auto">
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{strategy.confluences.length}</span> {strategy.confluences.length === 1 ? "confluence" : "confluences"}
        </span>
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{strategy.questions.length}</span> {strategy.questions.length === 1 ? "question" : "questions"}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">View →</span>
      </div>
    </div>
  );
}
