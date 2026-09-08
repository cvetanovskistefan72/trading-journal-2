"use client";

import { EquityCurve } from "@/components/analytics/EquityCurve";
import { SummaryStats } from "@/components/analytics/SummaryStats";
import { PnlByPeriod } from "@/components/analytics/PnlByPeriod";
import { WeekdayPerformance } from "@/components/analytics/WeekdayPerformance";
import { RMultipleDistribution } from "@/components/analytics/RMultipleDistribution";
import { InstrumentBreakdown } from "@/components/analytics/InstrumentBreakdown";
import { HoldTimeChart } from "@/components/analytics/HoldTimeChart";
import { SessionBreakdown } from "@/components/analytics/SessionBreakdown";

export default function PerformancePage() {
  return (
    <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
        <p className="text-sm text-muted-foreground">All-time trading analytics across your journal.</p>
      </div>

      <EquityCurve />
      <SummaryStats />
      <PnlByPeriod />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WeekdayPerformance />
        <RMultipleDistribution />
      </div>

      <SessionBreakdown />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InstrumentBreakdown />
        <HoldTimeChart />
      </div>
    </main>
  );
}
