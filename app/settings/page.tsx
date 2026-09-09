"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { COLOR_THEMES, applyTheme, getStoredThemeId, type ColorThemeId } from "@/lib/colorTheme";
import { Check } from "lucide-react";

function ThemeSwatch({ theme, active, onSelect }: {
  theme: typeof COLOR_THEMES[number];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-all",
        active
          ? "border-primary bg-accent/30"
          : "border-border bg-card hover:border-border/80 hover:bg-accent/10"
      )}
    >
      {/* Color preview bars */}
      <div className="flex gap-2 w-full">
        <div className="h-8 flex-1 rounded-md" style={{ background: theme.win }} />
        <div className="h-8 flex-1 rounded-md" style={{ background: theme.loss }} />
      </div>

      {/* P&L preview */}
      <div className="flex gap-3 text-sm font-bold tabular-nums">
        <span style={{ color: theme.win }}>+$250</span>
        <span style={{ color: theme.loss }}>-$180</span>
      </div>

      <p className="text-xs font-semibold text-foreground">{theme.label}</p>

      {active && (
        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState<ColorThemeId>("classic");

  useEffect(() => {
    setActive(getStoredThemeId());
  }, []);

  function handleSelect(id: ColorThemeId) {
    setActive(id);
    applyTheme(id);
  }

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-8 max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your trading journal appearance.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Color Theme</p>
          <p className="text-xs text-muted-foreground">
            Choose how wins and losses are colored across all charts and tables.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        <div className="rounded-xl border border-border bg-background p-4 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Live Preview</p>
          <div className="flex gap-6 items-center">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Today P&L</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--chart-1)" }}>+$342.50</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Yesterday</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--chart-2)" }}>-$128.00</p>
            </div>
            <div className="flex gap-2 ml-auto">
              <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "color-mix(in oklch, var(--chart-1) 15%, transparent)", color: "var(--chart-1)" }}>WIN</span>
              <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: "color-mix(in oklch, var(--chart-2) 15%, transparent)", color: "var(--chart-2)" }}>LOSS</span>
            </div>
          </div>
          {/* Mini bar chart preview */}
          <div className="flex items-end gap-1 h-12 pt-2">
            {[60, 80, -30, 100, -50, 45, 70].map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${Math.abs(v)}%`,
                  background: v >= 0 ? "var(--chart-1)" : "var(--chart-2)",
                  opacity: 0.85,
                  alignSelf: v >= 0 ? "flex-end" : "flex-start",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
