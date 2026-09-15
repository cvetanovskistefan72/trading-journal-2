"use client";

export type ColorThemeId = "classic" | "ocean" | "violet" | "mono";

export type ColorTheme = {
  id: ColorThemeId;
  label: string;
  win: string;       // --chart-1
  loss: string;      // --chart-2
  breakeven: string; // --chart-3
  long: string;      // --chart-4
  short: string;     // --chart-5
};

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "classic",
    label: "Classic",
    win:       "oklch(0.72 0.18 152)",   // emerald green
    loss:      "oklch(0.62 0.22 25)",    // red
    breakeven: "oklch(0.80 0.15 85)",    // amber
    long:      "oklch(0.68 0.16 245)",   // blue
    short:     "oklch(0.72 0.18 55)",    // orange
  },
  {
    id: "ocean",
    label: "Ocean",
    win:       "oklch(0.72 0.16 195)",   // teal
    loss:      "oklch(0.65 0.20 15)",    // coral red
    breakeven: "oklch(0.75 0.12 265)",   // slate blue
    long:      "oklch(0.68 0.15 230)",   // deep blue
    short:     "oklch(0.72 0.16 165)",   // seafoam
  },
  {
    id: "violet",
    label: "Violet",
    win:       "oklch(0.72 0.18 290)",   // violet
    loss:      "oklch(0.62 0.22 25)",    // red (same as classic — clear loss signal)
    breakeven: "oklch(0.72 0.14 200)",   // cyan
    long:      "oklch(0.68 0.18 310)",   // purple
    short:     "oklch(0.74 0.16 60)",    // yellow-orange
  },
  {
    id: "mono",
    label: "Mono",
    win:       "oklch(0.82 0 0)",        // light gray
    loss:      "oklch(0.45 0 0)",        // dark gray
    breakeven: "oklch(0.63 0 0)",        // mid gray
    long:      "oklch(0.72 0 0)",        // gray
    short:     "oklch(0.38 0 0)",        // darker gray
  },
];

const LS_KEY = "tj-color-theme";

export function getStoredThemeId(): ColorThemeId {
  if (typeof window === "undefined") return "classic";
  return (localStorage.getItem(LS_KEY) as ColorThemeId) ?? "classic";
}

export function applyTheme(id: ColorThemeId) {
  const theme = COLOR_THEMES.find((t) => t.id === id) ?? COLOR_THEMES[0];
  const root = document.documentElement;
  root.style.setProperty("--chart-1", theme.win);
  root.style.setProperty("--chart-2", theme.loss);
  root.style.setProperty("--chart-3", theme.breakeven);
  root.style.setProperty("--chart-4", theme.long);
  root.style.setProperty("--chart-5", theme.short);
  root.style.setProperty("--success", theme.win);
  root.style.setProperty("--primary", theme.win);
  root.style.setProperty("--sidebar-primary", theme.win);
  localStorage.setItem(LS_KEY, id);
}
