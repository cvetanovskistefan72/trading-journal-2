export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const RESULT_DOT: Record<string, string> = {
  win:       "bg-[var(--color-chart-1)]",
  loss:      "bg-[var(--color-chart-2)]",
  breakeven: "bg-[var(--color-chart-3)]",
};

export const RESULT_BG: Record<string, string> = {
  win:       "bg-[color-mix(in_oklch,var(--color-chart-1)_10%,transparent)] hover:bg-[color-mix(in_oklch,var(--color-chart-1)_15%,transparent)]",
  loss:      "bg-[color-mix(in_oklch,var(--color-chart-2)_8%,transparent)] hover:bg-[color-mix(in_oklch,var(--color-chart-2)_12%,transparent)]",
  breakeven: "bg-[color-mix(in_oklch,var(--color-chart-3)_8%,transparent)] hover:bg-[color-mix(in_oklch,var(--color-chart-3)_12%,transparent)]",
};

export const RESULT_TEXT: Record<string, string> = {
  win:       "text-[var(--color-chart-1)]",
  loss:      "text-[var(--color-chart-2)]",
  breakeven: "text-[var(--color-chart-3)]",
};

export const RESULT_BORDER: Record<string, string> = {
  win:       "border-[color-mix(in_oklch,var(--color-chart-1)_30%,transparent)]",
  loss:      "border-[color-mix(in_oklch,var(--color-chart-2)_20%,transparent)]",
  breakeven: "border-[color-mix(in_oklch,var(--color-chart-3)_30%,transparent)]",
};

export const DIRECTION_BADGE: Record<string, string> = {
  long:  "bg-[color-mix(in_oklch,var(--color-chart-4)_15%,transparent)] text-[var(--color-chart-4)]",
  short: "bg-[color-mix(in_oklch,var(--color-chart-5)_15%,transparent)] text-[var(--color-chart-5)]",
};

export function fmtPnl(pnl: number, compact = false) {
  const abs = Math.abs(pnl).toLocaleString("en-US", {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
  });
  return (pnl >= 0 ? "+" : "−") + "$" + abs;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Mon-anchored week grid for a given month (1-indexed)
export function buildCalendarGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month - 1, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
