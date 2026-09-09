"use client";

import Link from "next/link";
import { BookOpen, BarChart2, Calendar, TrendingUp } from "lucide-react";

const LINKS = [
  { href: "/journal", label: "Journal", icon: BookOpen, desc: "Log & review trades" },
  { href: "/analytics/performance", label: "Analytics", icon: BarChart2, desc: "Performance charts" },
  { href: "/analytics/day", label: "Calendar", icon: Calendar, desc: "Day-by-day view" },
  { href: "/analytics/strategies", label: "Strategies", icon: TrendingUp, desc: "Strategy breakdown" },
];

export function QuickLinks() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {LINKS.map(({ href, label, icon: Icon, desc }) => (
        <Link
          key={href}
          href={href}
          className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 hover:bg-accent/50 transition-colors group"
        >
          <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
