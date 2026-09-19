"use client";

import { useEffect, useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { EquityCurve } from "@/components/analytics/EquityCurve";
import { SummaryStats } from "@/components/analytics/SummaryStats";
import { PnlByPeriod } from "@/components/analytics/PnlByPeriod";
import { WeekdayPerformance } from "@/components/analytics/WeekdayPerformance";
import { RMultipleDistribution } from "@/components/analytics/RMultipleDistribution";
import { InstrumentBreakdown } from "@/components/analytics/InstrumentBreakdown";
import { HoldTimeChart } from "@/components/analytics/HoldTimeChart";
import { SessionBreakdown } from "@/components/analytics/SessionBreakdown";
import { LongShortBreakdown } from "@/components/analytics/LongShortBreakdown";
import { WinRateTrend } from "@/components/analytics/WinRateTrend";
import { GradeDistribution } from "@/components/analytics/GradeDistribution";
import { StreakStats } from "@/components/analytics/StreakStats";
import { DrawdownChart } from "@/components/analytics/DrawdownChart";
import { PnlDistribution } from "@/components/analytics/PnlDistribution";
import { ConfluencePerformance } from "@/components/analytics/ConfluencePerformance";
import { CalendarHeatmap } from "@/components/analytics/CalendarHeatmap";
import { TimeOfDayHeatmap } from "@/components/analytics/TimeOfDayHeatmap";
import { CumulativeRCurve } from "@/components/analytics/CumulativeRCurve";
import { TiltMeter } from "@/components/analytics/TiltMeter";
import { BestWorstDay } from "@/components/analytics/BestWorstDay";
import { TraderRadar } from "@/components/analytics/TraderRadar";
import { CostOfMistakes } from "@/components/analytics/CostOfMistakes";
import { InsightsCard } from "@/components/analytics/InsightsCard";

const STEPS = [
  "Fetching trades…",
  "Computing equity curve…",
  "Analysing win rate…",
  "Building session breakdown…",
  "Calculating drawdown…",
  "Preparing charts…",
];

function AnalyticsLoader({ progress }: { progress: number }) {
  const step = STEPS[Math.min(Math.floor((progress / 100) * STEPS.length), STEPS.length - 1)];
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-foreground">{step}</p>
        <p className="text-xs text-muted-foreground">Hang tight while we crunch your data…</p>
      </div>
      <div className="w-72 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: "var(--color-chart-1)" }}
        />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">{Math.round(progress)}%</p>
    </div>
  );
}

export default function PerformancePage() {
  const { data, isLoading, isFetching } = useAnalytics();
  const isWaiting = isLoading || isFetching;
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }
  }, []);

  useEffect(() => {
    if (!isWaiting) {
      setProgress(100);
      setTimeout(() => setReady(true), 300);
      return;
    }
    setReady(false);
    setProgress(0);
    const steps = [
      { target: 15, delay: 100 },
      { target: 35, delay: 400 },
      { target: 55, delay: 900 },
      { target: 72, delay: 1600 },
      { target: 85, delay: 2500 },
    ];
    const timers = steps.map(s => setTimeout(() => setProgress(s.target), s.delay));
    return () => timers.forEach(clearTimeout);
  }, [isWaiting]);

  return (
    <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
        <p className="text-sm text-muted-foreground">All-time trading analytics across your journal.</p>
      </div>

      {!ready ? (
        <AnalyticsLoader progress={progress} />
      ) : (
        <>
          <InsightsCard data={data} isLoading={isLoading} />
          <EquityCurve data={data} isLoading={isLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SummaryStats data={data} isLoading={isLoading} />
            <StreakStats data={data} isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <BestWorstDay data={data} isLoading={isLoading} />
            <TraderRadar data={data} isLoading={isLoading} />
          </div>

          <PnlByPeriod data={data} isLoading={isLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CalendarHeatmap data={data} isLoading={isLoading} />
            <DrawdownChart data={data} isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <WeekdayPerformance data={data} isLoading={isLoading} />
            <RMultipleDistribution data={data} isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <LongShortBreakdown data={data} isLoading={isLoading} />
            <WinRateTrend data={data} isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PnlDistribution data={data} isLoading={isLoading} />
            <GradeDistribution data={data} isLoading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TimeOfDayHeatmap data={data} isLoading={isLoading} />
            <CumulativeRCurve data={data} isLoading={isLoading} />
          </div>

          <TiltMeter data={data} isLoading={isLoading} />
          <SessionBreakdown data={data} isLoading={isLoading} />
          <ConfluencePerformance data={data} isLoading={isLoading} />
          <CostOfMistakes data={data} isLoading={isLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <InstrumentBreakdown data={data} isLoading={isLoading} />
            <HoldTimeChart data={data} isLoading={isLoading} />
          </div>
        </>
      )}
    </main>
  );
}
