"use client";

import { subMonths, subYears, startOfYear, format } from "date-fns";
import { cn } from "@/lib/utils";

export type PeriodPreset = "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

const PRESETS: PeriodPreset[] = ["1M", "3M", "6M", "YTD", "1Y", "ALL"];

export function fromDate(preset: PeriodPreset): string | undefined {
  const now = new Date();
  switch (preset) {
    case "1M":  return format(subMonths(now, 1), "yyyy-MM-dd");
    case "3M":  return format(subMonths(now, 3), "yyyy-MM-dd");
    case "6M":  return format(subMonths(now, 6), "yyyy-MM-dd");
    case "YTD": return format(startOfYear(now), "yyyy-MM-dd");
    case "1Y":  return format(subYears(now, 1), "yyyy-MM-dd");
    case "ALL": return undefined;
  }
}

export function PeriodFilter({
  value,
  onChange,
}: {
  value: PeriodPreset;
  onChange: (p: PeriodPreset) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs font-medium">
      {PRESETS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "px-3 py-1.5 transition-colors",
            value === p
              ? "bg-primary text-primary-foreground cursor-default"
              : "text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
