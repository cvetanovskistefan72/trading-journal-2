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
          <div className="bg-card rounded-2xl shadow-2xl border border-border/60 px-8 py-8 space-y-5">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                <LineChart className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground">Trading Journal</span>
            </div>

            <hr className="border-border/50" />

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
