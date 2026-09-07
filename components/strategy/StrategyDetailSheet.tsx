"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Strategy } from "@/types/strategy";

type Props = {
  strategy: Strategy | null;
  onClose: () => void;
};

export function StrategyDetailSheet({ strategy, onClose }: Props) {
  return (
    <Dialog open={!!strategy} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        {strategy && (
          <>
            {/* Header */}
            <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
              <div className="min-w-0 pr-8">
                <DialogTitle className="text-lg font-semibold truncate">
                  {strategy.name}
                </DialogTitle>
                {strategy.description && (
                  <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                )}
              </div>
            </DialogHeader>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Confluences */}
              <section className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Confluences
                </h3>
                {strategy.confluences.length === 0 ? (
                  <p className="text-sm text-muted-foreground/50 italic">None added.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {strategy.confluences.map((c) => (
                      <span
                        key={c}
                        className="rounded-md border border-border bg-muted/50 px-3 py-1 text-sm font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* Post-trade questions */}
              <section className="space-y-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Post-trade questions
                </h3>
                {strategy.questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground/50 italic">None added.</p>
                ) : (
                  <ol className="space-y-4">
                    {strategy.questions.map((q, i) => (
                      <li key={q.id} className="flex items-start gap-3">
                        <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded border border-border text-xs text-muted-foreground font-mono mt-0.5">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{q.text}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                              q.type === "multi"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-primary/10 text-primary"
                            }`}>
                              {q.type === "multi" ? "Multi choice" : "Single choice"}
                            </span>
                          </div>
                          {q.options.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {q.options.map((opt) => (
                                <span
                                  key={opt}
                                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground/50 italic">No options added.</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-3 flex items-center gap-4 shrink-0 bg-muted/20">
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{strategy.confluences.length}</span> confluences
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{strategy.questions.length}</span> post-trade questions
              </span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
