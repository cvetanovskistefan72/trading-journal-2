"use client";

import { LineChart } from "lucide-react";

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* Left — image panel (xl+ only to avoid the mid-width bleed) */}
      <div className="hidden xl:flex xl:w-1/2 relative overflow-hidden">
        <img src="/img/cover.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2.5">
            <LineChart className="h-5 w-5 text-white" />
            <span className="text-white font-semibold tracking-tight">Trading Journal</span>
          </div>
          <div className="space-y-3">
            <p className="text-white text-4xl font-bold leading-tight tracking-tight">
              Track every trade.<br />Master your edge.
            </p>
            <p className="text-white/50 text-sm font-medium">
              Log, review, and improve your trading performance over time.
            </p>
          </div>
        </div>
      </div>

      {/* Right — content panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background relative min-h-screen">

        {/* Mobile/tablet: image background */}
        <div className="absolute inset-0 xl:hidden">
          <img src="/img/cover.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="bg-card rounded-2xl shadow-2xl border border-border/60 p-8 space-y-6">

            {/* Logo */}
            <div className="flex items-center gap-2 pb-1">
              <LineChart className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold tracking-tight text-muted-foreground">Trading Journal</span>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
