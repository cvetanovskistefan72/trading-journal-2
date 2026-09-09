"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_THEMES, applyTheme, getStoredThemeId, type ColorThemeId } from "@/lib/colorTheme";
import { Button } from "@/components/ui/button";

function ThemeSwatch({ theme, active, onSelect }: {
  theme: typeof COLOR_THEMES[number];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer",
        active ? "border-primary" : "border-border hover:border-border/60"
      )}
      style={{ backgroundColor: active ? "oklch(0.34 0.006 286.033)" : "oklch(0.32 0.006 286)" }}
    >
      <div className="flex gap-1 w-full">
        <div className="h-5 flex-1 rounded" style={{ background: theme.win }} />
        <div className="h-5 flex-1 rounded" style={{ background: theme.loss }} />
        <div className="h-5 flex-1 rounded" style={{ background: theme.breakeven }} />
        <div className="h-5 flex-1 rounded" style={{ background: theme.long }} />
        <div className="h-5 flex-1 rounded" style={{ background: theme.short }} />
      </div>
      <div className="flex gap-1.5 text-[10px] font-bold tabular-nums flex-wrap">
        <span style={{ color: theme.win }}>+$250</span>
        <span style={{ color: theme.loss }}>-$180</span>
      </div>
      <p className="text-[11px] font-semibold text-foreground">{theme.label}</p>
      {active && (
        <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState<ColorThemeId>("classic");

  useEffect(() => {
    if (open) setActive(getStoredThemeId());
  }, [open]);

  function handleSelect(id: ColorThemeId) {
    setActive(id);
    applyTheme(id);
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 1000000 }}>
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.85)" }} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-5" style={{ backgroundColor: "oklch(0.28 0.006 285.885)" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold">Appearance</p>
            <p className="text-xs text-muted-foreground mt-0.5">Choose your win / loss / direction color theme</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Swatches */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COLOR_THEMES.map((theme) => (
            <ThemeSwatch
              key={theme.id}
              theme={theme}
              active={active === theme.id}
              onSelect={() => handleSelect(theme.id)}
            />
          ))}
        </div>

        {/* Live preview */}
        <div className="rounded-xl border border-border p-4 space-y-2" style={{ backgroundColor: "oklch(0.22 0.005 285.823)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Preview</p>
          <div className="flex gap-4 items-center flex-wrap">
            <p className="text-lg font-bold tabular-nums" style={{ color: "var(--chart-1)" }}>+$342.50</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: "var(--chart-2)" }}>-$128.00</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: "var(--chart-3)" }}>$0.00</p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "color-mix(in oklch, var(--chart-1) 15%, transparent)", color: "var(--chart-1)" }}>WIN</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "color-mix(in oklch, var(--chart-2) 15%, transparent)", color: "var(--chart-2)" }}>LOSS</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "color-mix(in oklch, var(--chart-3) 15%, transparent)", color: "var(--chart-3)" }}>BE</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "color-mix(in oklch, var(--chart-4) 15%, transparent)", color: "var(--chart-4)" }}>LONG</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "color-mix(in oklch, var(--chart-5) 15%, transparent)", color: "var(--chart-5)" }}>SHORT</span>
          </div>
          <div className="flex items-end gap-1 h-10">
            {[60, 80, -30, 100, -50, 45, 70].map((v, i) => (
              <div key={i} className="flex-1 rounded-sm" style={{
                height: `${Math.abs(v)}%`,
                background: v >= 0 ? "var(--chart-1)" : "var(--chart-2)",
                opacity: 0.8,
                alignSelf: v >= 0 ? "flex-end" : "flex-start",
              }} />
            ))}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
