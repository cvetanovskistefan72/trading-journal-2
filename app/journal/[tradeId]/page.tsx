"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, TrendingDown, X, Clock, Target, BarChart2, Award } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import axiosInstance from "@/lib/axios";
import { getImageUrl } from "@/services/image.service";
import type { Trade } from "@/types/trade";
import type { Strategy } from "@/types/strategy";

type TradeDetail = Trade & { strategy: Strategy; images: { id: string; thumbnailKey: string }[] };

const RESULT_COLOR: Record<string, string> = {
  win:       "var(--color-chart-1)",
  loss:      "var(--color-chart-2)",
  breakeven: "var(--color-chart-3)",
};

const RESULT_BG: Record<string, string> = {
  win:       "color-mix(in oklch, var(--color-chart-1) 8%, transparent)",
  loss:      "color-mix(in oklch, var(--color-chart-2) 8%, transparent)",
  breakeven: "color-mix(in oklch, var(--color-chart-3) 8%, transparent)",
};

const RESULT_BORDER: Record<string, string> = {
  win:       "color-mix(in oklch, var(--color-chart-1) 22%, transparent)",
  loss:      "color-mix(in oklch, var(--color-chart-2) 22%, transparent)",
  breakeven: "color-mix(in oklch, var(--color-chart-3) 22%, transparent)",
};

function StatRow({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color: valueColor }}>{value}</span>
    </div>
  );
}

export default function TradeDetailPage() {
  const { tradeId } = useParams<any>();
  const router = useRouter();
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data: trade, isLoading } = useQuery<TradeDetail>({
    queryKey: ["trade", tradeId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/api/trades/${tradeId}`);
      return data;
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner />
    </div>
  );

  if (!trade) return (
    <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
      Trade not found.
    </div>
  );

  const date = new Date(trade.date).toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const [eh, em] = trade.entryTime.split(":").map(Number);
  const [xh, xm] = trade.exitTime.split(":").map(Number);
  const entryMins = eh * 60 + em;
  const exitMins = xh * 60 + xm;
  const entryDate = trade.date.split("T")[0];
  const exitDateStr = trade.exitDate ?? entryDate;
  const dayDiff = (new Date(exitDateStr).getTime() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24);
  const holdMins = exitMins - entryMins + dayDiff * 24 * 60;
  const holdLabel = holdMins < 60
    ? `${holdMins}m`
    : `${Math.floor(holdMins / 60)}h ${holdMins % 60 > 0 ? `${holdMins % 60}m` : ""}`.trim();

  const rMultiple = trade.riskAmount > 0 ? trade.pnl / trade.riskAmount : null;
  const resultColor = RESULT_COLOR[trade.result];

  const answeredQuestions = trade.strategy?.questions?.filter((q) => {
    const ans = (trade.answers as any[]).find((a) => a.questionId === q.id);
    return ans && ans.selectedOptions.length > 0;
  }) ?? [];

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Top bar */}
      <div className="px-6 sm:px-8 py-[17.5px] border-b border-border flex items-center gap-4 shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="h-4 w-px bg-border" />
        <span className="text-sm text-muted-foreground">{date}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] min-h-full">

          {/* LEFT: primary content */}
          <div className="px-6 sm:px-8 py-8 space-y-6 border-r border-border">

            {/* Hero: instrument + P&L */}
            <div
              className="rounded-2xl border p-6"
              style={{ backgroundColor: RESULT_BG[trade.result], borderColor: RESULT_BORDER[trade.result] }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  {trade.direction === "long"
                    ? <TrendingUp className="h-5 w-5" style={{ color: "var(--color-chart-4)" }} />
                    : <TrendingDown className="h-5 w-5" style={{ color: "var(--color-chart-5)" }} />
                  }
                  <h1 className="text-4xl font-bold tracking-tight">{trade.instrument}</h1>
                </div>

                <div className="text-right">
                  <p className="text-4xl font-bold tabular-nums leading-none" style={{ color: resultColor }}>
                    {trade.pnl >= 0 ? "+" : "−"}${Math.abs(trade.pnl).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1.5">Net P&L</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span
                  className="rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                  style={{ backgroundColor: RESULT_BG[trade.result], color: resultColor, border: `1px solid ${RESULT_BORDER[trade.result]}` }}
                >
                  {trade.result === "breakeven" ? "BE" : trade.result}
                </span>
                <span
                  className="rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: trade.direction === "long"
                      ? "color-mix(in oklch, var(--color-chart-4) 15%, transparent)"
                      : "color-mix(in oklch, var(--color-chart-5) 15%, transparent)",
                    color: trade.direction === "long" ? "var(--color-chart-4)" : "var(--color-chart-5)",
                  }}
                >
                  {trade.direction}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  {trade.strategy?.name ?? "—"}
                  <span className="mx-2 opacity-40">·</span>
                  {trade.session}
                </span>
              </div>
            </div>

            {/* Confluences */}
            {trade.confluences.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Confluences</p>
                <div className="flex flex-wrap gap-2">
                  {trade.confluences.map((c) => (
                    <span key={c} className="rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium">{c}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Post-trade review */}
            {answeredQuestions.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Post-trade review</p>
                <div className="space-y-4">
                  {answeredQuestions.map((q) => {
                    const ans = (trade.answers as any[]).find((a) => a.questionId === q.id);
                    return (
                      <div key={q.id} className="rounded-xl border border-border bg-card px-4 py-3">
                        <p className="text-sm font-medium mb-2">{q.text}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ans.selectedOptions.map((opt: string) => (
                            <span key={opt} className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">{opt}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Notes */}
            {trade.notes && (
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Notes</p>
                <div className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{trade.notes}</p>
                </div>
              </section>
            )}

            {/* Screenshots */}
            {trade.images.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Screenshots</p>
                <div className="flex flex-wrap gap-3">
                  {trade.images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setLightbox(getImageUrl(img.id, true))}
                      className="group relative h-28 w-44 rounded-lg overflow-hidden border border-border bg-muted cursor-zoom-in shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(img.id)}
                        alt="Trade screenshot"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                    </button>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* RIGHT: stats sidebar */}
          <div className="px-6 py-8">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Trade details</p>
            <div className="rounded-xl border border-border bg-card px-4">
              <StatRow icon={<Clock className="h-4 w-4" />} label="Entry time" value={trade.entryTime} />
              <StatRow icon={<Clock className="h-4 w-4" />} label="Exit time" value={trade.exitTime} />
              <StatRow icon={<BarChart2 className="h-4 w-4" />} label="Hold time" value={holdLabel} />
              <StatRow icon={<Award className="h-4 w-4" />} label="Grade" value={trade.grade} />
              <StatRow icon={<Target className="h-4 w-4" />} label="Risk" value={`$${trade.riskAmount.toFixed(2)}`} />
              <StatRow
                icon={<BarChart2 className="h-4 w-4" />}
                label="R Multiple"
                value={rMultiple !== null ? `${rMultiple >= 0 ? "+" : ""}${rMultiple.toFixed(2)}R` : "—"}
                valueColor={rMultiple !== null ? (rMultiple >= 0 ? "var(--color-chart-1)" : "var(--color-chart-2)") : undefined}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox — images stay mounted so browser keeps them in memory cache */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-6 transition-opacity duration-200 ${lightbox ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setLightbox(null)}
      >
        <button
          type="button"
          onClick={() => setLightbox(null)}
          className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-6 w-6" />
        </button>
        {trade?.images.map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            src={getImageUrl(img.id, true)}
            alt="Trade screenshot fullsize"
            className={`max-w-full max-h-full rounded-xl shadow-2xl object-contain absolute transition-opacity duration-150 ${lightbox === getImageUrl(img.id, true) ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={(e) => e.stopPropagation()}
          />
        ))}
      </div>
    </div>
  );
}
