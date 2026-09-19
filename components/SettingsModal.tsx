"use client";

import { useState, useEffect } from "react";
import { Check, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredDensity, setStoredDensity, type JournalDensity } from "@/lib/journalDensity";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

function DensityPreview({ id }: { id: JournalDensity }) {
  if (id === "cards") {
    return (
      <div className="w-full rounded-lg border border-border bg-background overflow-hidden p-1.5 space-y-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border/50 bg-muted/20 p-1.5 flex items-center gap-2">
            <div className="h-2 w-5 rounded-full bg-muted-foreground/20 shrink-0" />
            <div className="h-2 w-8 rounded-full bg-muted-foreground/25 shrink-0" />
            <div className="h-2 flex-1 rounded-full bg-muted-foreground/10" />
            <div className="h-2 w-7 rounded-full shrink-0" style={{ background: i !== 1 ? "color-mix(in oklch, var(--chart-1) 50%, transparent)" : "color-mix(in oklch, var(--chart-2) 50%, transparent)" }} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="w-full rounded-lg border border-border bg-background overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 border-b border-border/50 last:border-0 h-7">
          <div className="h-1.5 w-6 rounded-full bg-muted-foreground/20 shrink-0" />
          <div className="h-1.5 w-10 rounded-full bg-muted-foreground/25 shrink-0" />
          <div className="h-1.5 flex-1 rounded-full bg-muted-foreground/10" />
          <div className="h-1.5 w-8 rounded-full shrink-0" style={{ background: i % 3 !== 1 ? "color-mix(in oklch, var(--chart-1) 50%, transparent)" : "color-mix(in oklch, var(--chart-2) 50%, transparent)" }} />
        </div>
      ))}
    </div>
  );
}

const DENSITY_OPTIONS: { id: JournalDensity; label: string; description: string }[] = [
  { id: "default", label: "Table", description: "Comfortable table rows" },
  { id: "cards", label: "Cards", description: "One card per trade" },
];

function DisplayPanel({ density, onSelect }: { density: JournalDensity; onSelect: (d: JournalDensity) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold mb-0.5">Journal View</p>
        <p className="text-xs text-muted-foreground mb-3">Choose how your trades are displayed</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={cn(
                "relative flex flex-col gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer",
                density === opt.id ? "border-primary bg-accent" : "border-border bg-muted/30 hover:bg-muted/50"
              )}
            >
              <DensityPreview id={opt.id} />
              <p className="text-[11px] font-semibold">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground">{opt.description}</p>
              {density === opt.id && (
                <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [density, setDensity] = useState<JournalDensity>("default");

  useEffect(() => {
    if (open) {
      setDensity(getStoredDensity());
    }
  }, [open]);

  function handleDensitySelect(d: JournalDensity) {
    setDensity(d);
    setStoredDensity(d);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex h-auto">
          {/* Left nav */}
          <div className="flex flex-col w-10 sm:w-48 shrink-0 border-r border-border bg-muted/20 p-1 sm:p-3 gap-0.5">
            <p className="hidden sm:block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-2">Settings</p>
            <button
              title="Display"
              className="w-full flex items-center justify-center sm:justify-start gap-2.5 sm:px-2 py-2 rounded-lg text-sm transition-colors cursor-pointer bg-accent text-accent-foreground font-medium"
            >
              <LayoutList className="h-4 w-4 shrink-0" />
              <span className="hidden sm:block">Display</span>
            </button>
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0 p-4 sm:p-5 overflow-y-auto">
            <DisplayPanel density={density} onSelect={handleDensitySelect} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
