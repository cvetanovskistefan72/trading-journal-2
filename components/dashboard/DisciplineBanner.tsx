"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { AlertTriangle, BookOpen, CheckCircle2, TrendingDown, Zap } from "lucide-react";

function Banner({
  icon: Icon,
  title,
  body,
  color,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  color: "red" | "amber" | "green" | "neutral";
}) {
  const styles = {
    red:     { border: "color-mix(in oklch, var(--chart-2) 20%, transparent)", bg: "color-mix(in oklch, var(--chart-2) 4%, transparent)", text: "var(--color-chart-2)" },
    amber:   { border: "color-mix(in oklch, var(--amber) 20%, transparent)",   bg: "color-mix(in oklch, var(--amber) 4%, transparent)",   text: "var(--amber)" },
    green:   { border: "color-mix(in oklch, var(--chart-1) 20%, transparent)", bg: "color-mix(in oklch, var(--chart-1) 4%, transparent)", text: "var(--color-chart-1)" },
    neutral: { border: "var(--border)", bg: "var(--card)", text: "var(--color-muted-foreground)" },
  }[color];

  return (
    <div
      className="rounded-lg border px-4 py-3.5 flex items-start gap-3 card-shadow"
      style={{ borderColor: styles.border, backgroundColor: styles.bg }}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: styles.text }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: styles.text }}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export function DisciplineBanner() {
  const { data, isLoading: _loading, isFetching } = useDashboard();
  const isLoading = _loading || isFetching;

  if (isLoading) return null;

  const streak      = data?.streak     ?? 0;
  const streakType  = data?.streakType;
  const weekTrades  = data?.weekTrades  ?? 0;
  const monthTrades = data?.monthTrades ?? 0;
  const todayPnl    = data?.todayPnl;

  if (streakType === "loss" && streak >= 3) {
    return (
      <Banner icon={AlertTriangle} color="red"
        title={`${streak}-loss streak — consider stepping back`}
        body={`Review your last ${streak} trades before continuing. Emotional trading after consecutive losses increases risk.`} />
    );
  }

  if (weekTrades >= 25) {
    return (
      <Banner icon={Zap} color="amber"
        title={`High trade volume this week (${weekTrades} trades)`}
        body="You've logged significantly more trades than usual. Make sure each setup meets your criteria." />
    );
  }

  if (streakType === "win" && streak >= 3) {
    return (
      <Banner icon={CheckCircle2} color="green"
        title={`${streak}-win streak — great trading!`}
        body="Keep following your process. Don't increase size or deviate from your plan during a hot streak." />
    );
  }

  if (weekTrades > 0 && todayPnl === 0 && monthTrades >= 5) {
    return (
      <Banner icon={BookOpen} color="neutral"
        title="Keep your journal up to date"
        body="No trades logged today. Consistent journaling is what separates disciplined traders — even a no-trade day is worth noting." />
    );
  }

  if (weekTrades === 0 && monthTrades > 0) {
    return (
      <Banner icon={TrendingDown} color="neutral"
        title="No trades logged this week"
        body="Patience is part of the process — only trade when your setup is there." />
    );
  }

  return null;
}
