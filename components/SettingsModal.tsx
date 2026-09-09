"use client";

import { useState, useEffect } from "react";
import { Check, Palette, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_THEMES, applyTheme, getStoredThemeId, type ColorThemeId } from "@/lib/colorTheme";
import { getStoredDensity, setStoredDensity, type JournalDensity } from "@/lib/journalDensity";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type SettingsSection = "appearance" | "display";

const NAV_ITEMS: { id: SettingsSection; label: string; icon: typeof Palette }[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "display", label: "Display", icon: LayoutList },
];

function ThemeSwatch({ theme, active, onSelect }: {
  theme: typeof COLOR_THEMES[number];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer w-full",
        active ? "border-primary bg-accent" : "border-border bg-muted/30 hover:bg-muted/50"
      )}
    >
      <div className="flex gap-1 w-full">
        <div className="h-4 flex-1 rounded" style={{ background: theme.win }} />
        <div className="h-4 flex-1 rounded" style={{ background: theme.loss }} />
        <div className="h-4 flex-1 rounded" style={{ background: theme.breakeven }} />
        <div className="h-4 flex-1 rounded" style={{ background: theme.long }} />
        <div className="h-4 flex-1 rounded" style={{ background: theme.short }} />
      </div>
      <div className="flex gap-1.5 text-[10px] font-bold tabular-nums">
        <span style={{ color: theme.win }}>+$250</span>
        <span style={{ color: theme.loss }}>-$180</span>
      </div>
      <p className="text-[11px] font-semibold">{theme.label}</p>
      {active && (
        <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

function AppearancePanel({ active, onSelect }: { active: ColorThemeId; onSelect: (id: ColorThemeId) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold mb-0.5">Color Theme</p>
        <p className="text-xs text-muted-foreground mb-3">Choose your win / loss / direction color palette</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COLOR_THEMES.map((theme) => (
            <ThemeSwatch
              key={theme.id}
              theme={theme}
              active={active === theme.id}
              onSelect={() => onSelect(theme.id)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border p-3 space-y-2 bg-muted/30">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Preview</p>
        <div className="flex gap-3 items-center flex-wrap">
          <p className="text-base font-bold tabular-nums" style={{ color: "var(--chart-1)" }}>+$342.50</p>
          <p className="text-base font-bold tabular-nums" style={{ color: "var(--chart-2)" }}>-$128.00</p>
          <p className="text-base font-bold tabular-nums" style={{ color: "var(--chart-3)" }}>$0.00</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["WIN", "LOSS", "BE", "LONG", "SHORT"] as const).map((label, i) => (
            <span key={label} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
              background: `color-mix(in oklch, var(--chart-${i + 1}) 15%, transparent)`,
              color: `var(--chart-${i + 1})`,
            }}>{label}</span>
          ))}
        </div>
        <div className="flex items-end gap-1 h-8">
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
  );
}

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
  const [section, setSection] = useState<SettingsSection>("appearance");
  const [activeTheme, setActiveTheme] = useState<ColorThemeId>("classic");
  const [density, setDensity] = useState<JournalDensity>("default");

  useEffect(() => {
    if (open) {
      setActiveTheme(getStoredThemeId());
      setDensity(getStoredDensity());
    }
  }, [open]);

  function handleThemeSelect(id: ColorThemeId) {
    setActiveTheme(id);
    applyTheme(id);
  }

  function handleDensitySelect(d: JournalDensity) {
    setDensity(d);
    setStoredDensity(d);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex h-full min-h-96">
          {/* Left nav */}
          <div className="flex flex-col w-10 sm:w-48 shrink-0 border-r border-border bg-muted/20 p-1 sm:p-3 gap-0.5">
            <p className="hidden sm:block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-2">Settings</p>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                title={label}
                className={cn(
                  "w-full flex items-center justify-center sm:justify-start gap-2.5 sm:px-2 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                  section === id
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0 p-4 sm:p-5 overflow-y-auto">
            {section === "appearance" && (
              <AppearancePanel active={activeTheme} onSelect={handleThemeSelect} />
            )}
            {section === "display" && (
              <DisplayPanel density={density} onSelect={handleDensitySelect} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
