"use client";

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
import { WaterfallChart } from "@/components/analytics/WaterfallChart";
import { MonteCarlo } from "@/components/analytics/MonteCarlo";
import { TiltMeter } from "@/components/analytics/TiltMeter";

export default function PerformancePage() {
  return (
    <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
        <p className="text-sm text-muted-foreground">All-time trading analytics across your journal.</p>
      </div>

      <EquityCurve />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SummaryStats />
        <StreakStats />
      </div>

      <PnlByPeriod />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CalendarHeatmap />
        <DrawdownChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WeekdayPerformance />
        <RMultipleDistribution />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <LongShortBreakdown />
        <WinRateTrend />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PnlDistribution />
        <GradeDistribution />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TimeOfDayHeatmap />
        <CumulativeRCurve />
      </div>

      <WaterfallChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MonteCarlo />
        <TiltMeter />
      </div>

      <SessionBreakdown />
      <ConfluencePerformance />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InstrumentBreakdown />
        <HoldTimeChart />
      </div>
    </main>
  );
}
