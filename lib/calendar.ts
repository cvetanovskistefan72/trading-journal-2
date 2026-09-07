export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const RESULT_DOT: Record<string, string> = {
  win: "bg-emerald-500",
  loss: "bg-rose-400",
  breakeven: "bg-amber-400",
};

export const RESULT_BG: Record<string, string> = {
  win: "bg-emerald-500/8 hover:bg-emerald-500/12",
  loss: "bg-rose-400/6 hover:bg-rose-400/10",
  breakeven: "bg-amber-400/8 hover:bg-amber-400/12",
};

export const RESULT_TEXT: Record<string, string> = {
  win: "text-emerald-500",
  loss: "text-rose-400",
  breakeven: "text-amber-500",
};

export const RESULT_BORDER: Record<string, string> = {
  win: "border-emerald-500/30",
  loss: "border-rose-400/20",
  breakeven: "border-amber-400/30",
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
