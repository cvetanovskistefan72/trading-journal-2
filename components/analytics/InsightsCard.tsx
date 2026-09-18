"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import type { AnalyticsData } from "@/hooks/useAnalytics";
import { TrendingUp, TrendingDown, Clock, Target, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Insight = {
  icon: React.ElementType;
  title: string;
  body: string;
  tone: "positive" | "negative" | "neutral" | "warning";
};

function generateInsights(data: AnalyticsData): Insight[] {
  const insights: Insight[] = [];
  const { summary, byWeekday, bySession, byConfluence, bestDay, worstDay, holdTime, winRateTrend } = data;

  if (summary.total < 5) return [];

  // Best day callout
  if (bestDay && worstDay && bestDay.day !== worstDay.day) {
    insights.push({
      icon: TrendingUp,
      title: `${bestDay.day} is your best trading day`,
      body: `You average ${bestDay.avgPnl >= 0 ? "+" : ""}$${Math.abs(bestDay.avgPnl).toFixed(2)} on ${bestDay.day}s across ${bestDay.tradingDays} sessions. Consider sizing up or being more selective on other days.`,
      tone: "positive",
    });
  }

  // Worst day callout
  if (worstDay && worstDay.avgPnl < 0) {
    insights.push({
      icon: TrendingDown,
      title: `${worstDay.day} is consistently hurting you`,
      body: `Your average P&L on ${worstDay.day}s is $${worstDay.avgPnl.toFixed(2)} over ${worstDay.tradingDays} sessions. Consider sitting out or reducing size on ${worstDay.day}s.`,
      tone: "negative",
    });
  }

  // Best confluence callout
  const sortedConf = [...byConfluence].sort((a, b) => b.avgR - a.avgR);
  if (sortedConf.length > 0 && sortedConf[0].trades >= 3) {
    const best = sortedConf[0];
    insights.push({
      icon: Target,
      title: `"${best.confluence}" is your strongest setup`,
      body: `Trades with "${best.confluence}" average ${best.avgR >= 0 ? "+" : ""}${best.avgR.toFixed(2)}R with a ${best.winRate.toFixed(0)}% win rate across ${best.trades} trades.`,
      tone: "positive",
    });
  }

  // Worst confluence
  const worstConf = sortedConf[sortedConf.length - 1];
  if (worstConf && worstConf !== sortedConf[0] && worstConf.trades >= 3 && worstConf.avgR < 0) {
    insights.push({
      icon: AlertTriangle,
      title: `"${worstConf.confluence}" is your weakest tag`,
      body: `Trades tagged "${worstConf.confluence}" average ${worstConf.avgR.toFixed(2)}R with only ${worstConf.winRate.toFixed(0)}% win rate. Review whether this setup still fits your edge.`,
      tone: "warning",
    });
  }

  // Best session
  const sortedSession = [...bySession].sort((a, b) => b.pnl - a.pnl);
  if (sortedSession.length >= 2) {
    const bestSession = sortedSession[0];
    const worstSession = sortedSession[sortedSession.length - 1];
    if (bestSession.trades >= 3) {
      insights.push({
        icon: Clock,
        title: `${bestSession.session} session is your most profitable`,
        body: `You've made $${bestSession.pnl.toFixed(2)} in the ${bestSession.session} session with a ${bestSession.winRate.toFixed(0)}% win rate. ${worstSession.pnl < 0 ? `The ${worstSession.session} session is costing you $${Math.abs(worstSession.pnl).toFixed(2)}.` : ""}`,
        tone: "positive",
      });
    }
  }

  // Win rate trend direction
  if (winRateTrend.length >= 2) {
    const last5 = winRateTrend.slice(-5);
    const first = last5[0].winRate;
    const last = last5[last5.length - 1].winRate;
    const diff = last - first;
    if (Math.abs(diff) >= 10) {
      insights.push({
        icon: diff > 0 ? Zap : TrendingDown,
        title: diff > 0 ? "Win rate is trending up" : "Win rate is trending down",
        body: diff > 0
          ? `Your rolling win rate has improved by ${diff.toFixed(0)}pp over your last ${last5.length * 4} trades. Keep doing what's working.`
          : `Your rolling win rate has dropped ${Math.abs(diff).toFixed(0)}pp recently. Review your last trades for pattern changes.`,
        tone: diff > 0 ? "positive" : "warning",
      });
    }
  }

  // Hold time sweet spot
  const bestHold = [...holdTime].filter((h) => h.trades >= 3).sort((a, b) => b.avgR - a.avgR)[0];
  if (bestHold) {
    insights.push({
      icon: Clock,
      title: `${bestHold.label} hold time is your sweet spot`,
      body: `Trades held ${bestHold.label} average ${bestHold.avgR >= 0 ? "+" : ""}${bestHold.avgR.toFixed(2)}R with a ${bestHold.winRate.toFixed(0)}% win rate across ${bestHold.trades} trades.`,
      tone: "neutral",
    });
  }

  return insights.slice(0, 4);
}

const toneStyles: Record<Insight["tone"], { border: string; bg: string; icon: string }> = {
  positive: {
    border: "border-[color-mix(in_oklch,var(--color-chart-1)_20%,transparent)]",
    bg: "bg-[color-mix(in_oklch,var(--color-chart-1)_4%,transparent)]",
    icon: "text-[var(--color-chart-1)]",
  },
  negative: {
    border: "border-[color-mix(in_oklch,var(--color-chart-2)_20%,transparent)]",
    bg: "bg-[color-mix(in_oklch,var(--color-chart-2)_4%,transparent)]",
    icon: "text-[var(--color-chart-2)]",
  },
  warning: {
    border: "border-[color-mix(in_oklch,var(--color-chart-3)_20%,transparent)]",
    bg: "bg-[color-mix(in_oklch,var(--color-chart-3)_4%,transparent)]",
    icon: "text-[var(--color-chart-3)]",
  },
  neutral: {
    border: "border-border",
    bg: "bg-background",
    icon: "text-muted-foreground",
  },
};

export function InsightsCard() {
  const { data, isLoading } = useAnalytics();

  const insights = data ? generateInsights(data) : [];

  return (
    <div className="rounded-lg border border-border bg-card card-shadow p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Auto Insights</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Generated from your trading patterns</p>
        </div>
        <Zap className="h-4 w-4 text-muted-foreground opacity-60 shrink-0" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-background p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
          Log more trades to generate insights
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.map((insight, i) => {
            const styles = toneStyles[insight.tone];
            const Icon = insight.icon;
            return (
              <div key={i} className={cn("rounded-lg border p-4 flex gap-3", styles.border, styles.bg)}>
                <div className="shrink-0 mt-0.5">
                  <Icon className={cn("h-4 w-4", styles.icon)} />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-snug">{insight.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
