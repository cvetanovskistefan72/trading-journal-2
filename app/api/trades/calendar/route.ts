import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { CalendarTrade, CalendarDay } from "@/types/calendar";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month param required (YYYY-MM)" }, { status: 400 });
  }

  const [year, mon] = month.split("-").map(Number);
  const from = new Date(year, mon - 1, 1);
  const to = new Date(year, mon, 0, 23, 59, 59, 999);

  const trades = await prisma.trade.findMany({
    where: {
      userId: user.id,
      archived: false,
      date: { gte: from, lte: to },
    },
    select: {
      id: true,
      date: true,
      pnl: true,
      riskAmount: true,
      instrument: true,
      direction: true,
      session: true,
      entryTime: true,
      exitTime: true,
      result: true,
      grade: true,
      notes: true,
      strategy: { select: { name: true } },
    },
    orderBy: [{ date: "asc" }, { entryTime: "asc" }],
  });

  const byDate = new Map<string, { pnl: number; trades: CalendarTrade[] }>();
  for (const t of trades) {
    const key = t.date.toISOString().split("T")[0];
    const existing = byDate.get(key) ?? { pnl: 0, trades: [] };
    existing.pnl += t.pnl;
    existing.trades.push({
      id: t.id,
      instrument: t.instrument,
      direction: t.direction as "long" | "short",
      session: t.session,
      entryTime: t.entryTime,
      exitTime: t.exitTime,
      pnl: t.pnl,
      riskAmount: t.riskAmount,
      result: t.result as "win" | "loss" | "breakeven",
      grade: t.grade,
      strategyName: t.strategy?.name ?? "—",
      notes: t.notes,
    });
    byDate.set(key, existing);
  }

  const days: CalendarDay[] = Array.from(byDate.entries()).map(([date, { pnl, trades: dayTrades }]) => {
    const rounded = Math.round(pnl * 100) / 100;
    return {
      date,
      pnl: rounded,
      tradeCount: dayTrades.length,
      result: rounded > 0 ? "win" : rounded < 0 ? "loss" : "breakeven",
      trades: dayTrades,
    };
  });

  return NextResponse.json(days);
}
