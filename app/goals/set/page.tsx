"use client";

import { useState, useEffect } from "react";
import { useGoals, useCreateGoal, useDeleteGoal } from "@/hooks/useGoals";
import type { GoalType } from "@prisma/client";
import { Plus, Trash2, Pencil, Target, TrendingDown, Activity, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const GOAL_META: Record<GoalType, {
  label: string; description: string;
  prefix?: string; suffix?: string;
  icon: React.ElementType;
}> = {
  WEEKLY_PROFIT:      { label: "Weekly Profit Target",  description: "The P&L amount you want to reach this week.", prefix: "$", icon: Target },
  MONTHLY_PROFIT:     { label: "Monthly Profit Target", description: "The P&L amount you want to reach this month.", prefix: "$", icon: Target },
  YEARLY_PROFIT:      { label: "Yearly Profit Target",  description: "The P&L amount you want to reach this year.", prefix: "$", icon: Target },
  MAX_DRAWDOWN:       { label: "Max Drawdown Limit",    description: "Max drawdown % allowed (all-time) before stopping.", suffix: "%", icon: TrendingDown },
  WIN_RATE:           { label: "Win Rate Target",       description: "The win rate % you are aiming to maintain (all-time).", suffix: "%", icon: Activity },
  WEEKLY_TRADE_COUNT: { label: "Weekly Trade Count",    description: "The number of trades you plan to take this week.", suffix: "trades", icon: BarChart2 },
  MONTHLY_TRADE_COUNT:{ label: "Monthly Trade Count",   description: "The number of trades you plan to take this month.", suffix: "trades", icon: BarChart2 },
};

const ALL_TYPES: GoalType[] = [
  "YEARLY_PROFIT",
  "MONTHLY_PROFIT",
  "WEEKLY_PROFIT",
  "MONTHLY_TRADE_COUNT",
  "WEEKLY_TRADE_COUNT",
  "WIN_RATE",
  "MAX_DRAWDOWN",
];

function formatValue(type: GoalType, value: number) {
  const m = GOAL_META[type];
  const num = type === "MONTHLY_PROFIT"
    ? value.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : value % 1 === 0 ? String(value) : value.toFixed(1);
  const sep = m.suffix === "trades" ? " " : "";
  return `${m.prefix ?? ""}${num}${m.suffix ? sep + m.suffix : ""}`;
}

// Used for both create and edit — edit mode locks the type, create mode lets you pick
function GoalModal({ open, onClose, availableTypes, editType, editCurrentValue }: {
  open: boolean; onClose: () => void;
  availableTypes: GoalType[];
  editType?: GoalType;       // set when editing
  editCurrentValue?: number; // set when editing
}) {
  const isEdit = editType !== undefined;
  const [type, setType] = useState<GoalType>(editType ?? availableTypes[0] ?? "MONTHLY_PROFIT");
  const [value, setValue] = useState(editCurrentValue != null ? String(editCurrentValue) : "");
  const { mutate: create, isPending } = useCreateGoal();

  useEffect(() => {
    if (open) {
      setType(editType ?? availableTypes[0] ?? "MONTHLY_PROFIT");
      setValue(editCurrentValue != null ? String(editCurrentValue) : "");
    }
  }, [open]);

  function handleOpenChange(o: boolean) {
    if (!o) { onClose(); }
  }

  function submit() {
    if (!type) { toast.error("Select a goal type"); return; }
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) { toast.error("Enter a valid number"); return; }
    create({ type, value: v }, {
      onSuccess: () => { toast.success(isEdit ? "Goal updated" : "Goal created"); onClose(); },
      onError: () => toast.error("Failed to save goal"),
    });
  }

  const meta = GOAL_META[type];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Goal" : "Add Goal"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isEdit && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Goal type</p>
              <div className="grid grid-cols-1 gap-2">
                {availableTypes.map((t) => {
                  const Icon = GOAL_META[t].icon;
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors cursor-pointer ${
                        type === t
                          ? "border-[var(--color-chart-1)] bg-[color-mix(in_oklch,var(--color-chart-1)_8%,transparent)]"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[var(--color-chart-1)]" />
                      <div>
                        <p className="font-medium text-foreground">{GOAL_META[t].label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{GOAL_META[t].description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isEdit && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/40">
              {(() => { const Icon = meta.icon; return <Icon className="h-4 w-4 shrink-0 text-[var(--color-chart-1)]" />; })()}
              <div>
                <p className="text-sm font-medium text-foreground">{meta.label}</p>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Target value</p>
            <div className="flex items-center gap-1.5">
              {meta.prefix && <span className="text-sm text-muted-foreground">{meta.prefix}</span>}
              <input
                autoFocus
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
                placeholder="0"
                className="w-40 rounded-md border border-border bg-background px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {meta.suffix && <span className="text-sm text-muted-foreground">{meta.suffix}</span>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={isPending}>Save goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const { mutate: deleteGoal } = useDeleteGoal();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<{ type: GoalType; value: number } | null>(null);

  const existingTypes = new Set(goals?.map((g) => g.type) ?? []);
  const availableTypes = ALL_TYPES.filter((t) => !existingTypes.has(t));
  const sortedGoals = [...(goals ?? [])].sort((a, b) => ALL_TYPES.indexOf(a.type) - ALL_TYPES.indexOf(b.type));

  function handleDelete(type: GoalType) {
    deleteGoal(type, {
      onSuccess: () => toast.success("Goal removed"),
      onError: () => toast.error("Failed to remove goal"),
    });
  }

  if (isLoading) {
    return (
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 w-40 bg-muted rounded animate-pulse" />
          <div className="h-9 w-28 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Set Goals</h1>
          <p className="text-sm text-muted-foreground">Configure your trading targets.</p>
        </div>
        {availableTypes.length > 0 && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add Goal
          </Button>
        )}
      </div>

      {sortedGoals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sortedGoals.map((goal) => {
            const meta = GOAL_META[goal.type];
            const Icon = meta.icon;
            return (
              <div key={goal.id} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[color-mix(in_oklch,var(--color-chart-1)_10%,transparent)]">
                      <Icon className="h-4 w-4 text-[var(--color-chart-1)]" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{meta.label}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditing({ type: goal.type, value: goal.value })}
                      className="cursor-pointer p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.type)}
                      className="cursor-pointer p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-[var(--color-chart-2)] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-3xl font-bold tabular-nums text-[var(--color-chart-1)]">
                    {formatValue(goal.type, goal.value)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <p className="text-sm font-medium text-foreground">No goals set yet</p>
          <p className="text-xs text-muted-foreground">Click "Add Goal" to set your first monthly target.</p>
        </div>
      )}

      {/* Create modal */}
      <GoalModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        availableTypes={availableTypes}
      />

      {/* Edit modal */}
      {editing && (
        <GoalModal
          open={!!editing}
          onClose={() => setEditing(null)}
          availableTypes={[]}
          editType={editing.type}
          editCurrentValue={editing.value}
        />
      )}
    </main>
  );
}
