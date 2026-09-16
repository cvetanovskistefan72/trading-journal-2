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
import { GoalsProgress } from "@/components/analytics/GoalsProgress";

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
        <p className="text-xs text-muted-foreground">This only happens once — results are cached</p>
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

function Section({ children, delay, visible }: { children: React.ReactNode; delay: number; visible: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!visible) { setShow(false); return; }
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [visible, delay]);

  return (
    <div className={`transition-all duration-500 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
      {show && children}
    </div>
  );
}

export default function PerformancePage() {
  const { isLoading } = useAnalytics();
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
    if (!isLoading) {
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
  }, [isLoading]);

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
          <Section visible={ready} delay={0}><InsightsCard /></Section>
          <Section visible={ready} delay={200}><GoalsProgress /></Section>
          <Section visible={ready} delay={400}><EquityCurve /></Section>

          <Section visible={ready} delay={650}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SummaryStats />
              <StreakStats />
            </div>
          </Section>

          <Section visible={ready} delay={900}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <BestWorstDay />
              <TraderRadar />
            </div>
          </Section>

          <Section visible={ready} delay={1150}><PnlByPeriod /></Section>

          <Section visible={ready} delay={1400}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <CalendarHeatmap />
              <DrawdownChart />
            </div>
          </Section>

          <Section visible={ready} delay={1650}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <WeekdayPerformance />
              <RMultipleDistribution />
            </div>
          </Section>

          <Section visible={ready} delay={1900}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <LongShortBreakdown />
              <WinRateTrend />
            </div>
          </Section>

          <Section visible={ready} delay={2150}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <PnlDistribution />
              <GradeDistribution />
            </div>
          </Section>

          <Section visible={ready} delay={2400}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <TimeOfDayHeatmap />
              <CumulativeRCurve />
            </div>
          </Section>

          <Section visible={ready} delay={2650}><TiltMeter /></Section>
          <Section visible={ready} delay={2900}><SessionBreakdown /></Section>
          <Section visible={ready} delay={3150}><ConfluencePerformance /></Section>
          <Section visible={ready} delay={3400}><CostOfMistakes /></Section>

          <Section visible={ready} delay={3650}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <InstrumentBreakdown />
              <HoldTimeChart />
            </div>
          </Section>
        </>
      )}
    </main>
  );
}
