"use client";

import { SnapshotRow } from "@/components/dashboard/SnapshotRow";
import { StatTiles } from "@/components/dashboard/StatTiles";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { MiniHeatmap } from "@/components/dashboard/MiniHeatmap";
import { DisciplineBanner } from "@/components/dashboard/DisciplineBanner";
import { QuickLinks } from "@/components/dashboard/QuickLinks";
import { AddTradeButton } from "@/components/dashboard/AddTradeButton";

export default function DashboardPage() {
  return (
    <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your trading overview at a glance</p>
        </div>
        <AddTradeButton />
      </div>

      {/* Discipline banner — only renders when there is something to say */}
      <DisciplineBanner />

      {/* P&L snapshot: today / this week / this month / all time */}
      <SnapshotRow />

      {/* Key stat tiles: win rate, streak, trades this week, trades this month */}
      <StatTiles />

      {/* Recent trades + mini heatmap side by side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <RecentTrades />
        <MiniHeatmap />
      </div>

      {/* Quick links row */}
      <QuickLinks />

    </main>
  );
}
