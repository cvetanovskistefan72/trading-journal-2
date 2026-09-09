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
    win:       "oklch(0.72 0.18 152)",      // emerald
    loss:      "oklch(0.704 0.191 22.216)", // red
    breakeven: "oklch(0.828 0.189 84.429)", // amber
    long:      "oklch(0.70 0.16 240)",      // blue
    short:     "oklch(0.72 0.17 55)",       // orange
  },
  {
    id: "ocean",
    label: "Ocean",
    win:       "oklch(0.75 0.15 195)",
    loss:      "oklch(0.72 0.17 55)",
    breakeven: "oklch(0.80 0.14 270)",
    long:      "oklch(0.72 0.15 220)",
    short:     "oklch(0.75 0.16 30)",
  },
  {
    id: "violet",
    label: "Violet",
    win:       "oklch(0.70 0.18 290)",
    loss:      "oklch(0.75 0.17 75)",
    breakeven: "oklch(0.75 0.15 200)",
    long:      "oklch(0.72 0.18 310)",
    short:     "oklch(0.75 0.16 60)",
  },
  {
    id: "mono",
    label: "Mono",
    win:       "oklch(0.85 0 0)",
    loss:      "oklch(0.50 0 0)",
    breakeven: "oklch(0.65 0 0)",
    long:      "oklch(0.75 0 0)",
    short:     "oklch(0.45 0 0)",
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
