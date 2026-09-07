"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ToggleGroupProps<T extends string> = {
  options: T[];
  value: T | "";
  onChange: (v: T) => void;
  className?: string;
  renderLabel?: (v: T) => string;
};

export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  renderLabel,
}: ToggleGroupProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => (
        <Button
          key={opt}
          type="button"
          variant={value === opt ? "default" : "outline"}
          onClick={() => onChange(opt)}
        >
          {renderLabel ? renderLabel(opt) : opt.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
