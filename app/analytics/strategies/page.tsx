"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { StrategyDialog } from "@/components/strategy-dialog";
import { StrategyDetailSheet } from "@/components/strategy-detail-sheet";
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
    onError: () => toast.error("Failed to delete strategy"),
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
  const visibleConfluences = strategy.confluences.slice(0, 4);
  const extraConfluences = strategy.confluences.length - visibleConfluences.length;

  return (
    <div
      className="relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md hover:shadow-black/20 hover:border-border/80 cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate">{strategy.name}</h3>
          {strategy.description ? (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{strategy.description}</p>
          ) : (
            <p className="text-xs text-muted-foreground/40 mt-1">No description</p>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button size="icon" variant="ghost" onClick={onEdit} className="h-7 w-7">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} className="h-7 w-7 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-border/50" />

      {/* Confluences preview */}
      <div className="px-5 py-4 flex-1">
        {strategy.confluences.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {visibleConfluences.map((c) => (
              <span
                key={c}
                className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium truncate max-w-36"
              >
                {c}
              </span>
            ))}
            {extraConfluences > 0 && (
              <span className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground">
                +{extraConfluences}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/40 italic">No confluences</p>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 border-t border-border/50 px-5 py-2.5 bg-muted/20">
        <span className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{strategy.confluences.length}</span> confluences
        </span>
        <span className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{strategy.questions.length}</span> post-trade q.
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground/50">Click to view →</span>
      </div>
    </div>
  );
}
