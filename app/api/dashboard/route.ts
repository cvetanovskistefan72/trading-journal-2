import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const round2 = (n: number) => Math.round(n * 100) / 100;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d: Date) {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return startOfDay(mon);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}
function startOfLastMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}
function endOfLastMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999);
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfLastMonth(now);
  const lastMonthEnd = endOfLastMonth(now);

  const yearStart = startOfYear(now);

  const [allTrades, recentTrades, allTimePnlAgg, lastMonthAgg] = await Promise.all([
    prisma.trade.findMany({
      where: {
        userId: token.sub,
        archived: false,
        date: { gte: yearStart },
      },
      select: {
        date: true,
        pnl: true,
        result: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.trade.findMany({
      where: { userId: token.sub, archived: false },
      select: {
        id: true,
        date: true,
        instrument: true,
        direction: true,
        pnl: true,
        result: true,
        grade: true,
        strategy: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.trade.aggregate({
      where: { userId: token.sub, archived: false },
      _sum: { pnl: true },
    }),
    prisma.trade.aggregate({
      where: { userId: token.sub, archived: false, date: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { pnl: true },
      _count: { _all: true },
    }),
  ]);

  let todayPnl = 0;
  let weekPnl = 0;
  let monthPnl = 0;
  let yearPnl = 0;
  let weekTrades = 0;
  let monthTrades = 0;
  let yearTrades = 0;

  // Mini heatmap: last 35 calendar days keyed by date
  const heatmapMap = new Map<string, { pnl: number; trades: number; wins: number; losses: number }>();

  for (const t of allTrades) {
    const d = t.date;
    const key = d.toISOString().slice(0, 10);

    if (d >= todayStart) todayPnl += t.pnl;
    if (d >= weekStart) { weekPnl += t.pnl; weekTrades++; }
    if (d >= monthStart) { monthPnl += t.pnl; monthTrades++; }
    yearPnl += t.pnl; yearTrades++;

    const cell = heatmapMap.get(key) ?? { pnl: 0, trades: 0, wins: 0, losses: 0 };
    cell.pnl += t.pnl;
    cell.trades++;
    if (t.result === "win") cell.wins++;
    else if (t.result === "loss") cell.losses++;
    heatmapMap.set(key, cell);
  }

  // Build 35-day heatmap array (last 35 days, oldest first)
  const miniHeatmap: { date: string; pnl: number; trades: number; wins: number; losses: number; result: "win" | "loss" | "breakeven" | null }[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const cell = heatmapMap.get(key);
    if (cell) {
      const pnl = round2(cell.pnl);
      miniHeatmap.push({
        date: key,
        pnl,
        trades: cell.trades,
        wins: cell.wins,
        losses: cell.losses,
        result: pnl > 0 ? "win" : pnl < 0 ? "loss" : "breakeven",
      });
    } else {
      miniHeatmap.push({ date: key, pnl: 0, trades: 0, wins: 0, losses: 0, result: null });
    }
  }

  // Streak — need all-time for accuracy
  const allTimeStreak = await prisma.trade.findMany({
    where: { userId: token.sub, archived: false, result: { in: ["win", "loss"] } },
    select: { result: true },
    orderBy: { date: "desc" },
    take: 100,
  });

  let streak = 0;
  let streakType: "win" | "loss" | null = null;
  if (allTimeStreak.length > 0) {
    streakType = allTimeStreak[0].result as "win" | "loss";
    for (const t of allTimeStreak) {
      if (t.result === streakType) streak++;
      else break;
    }
  }

  // Win rates
  const weekWins = allTrades.filter((t) => t.date >= weekStart && t.result === "win").length;
  const weekDecided = allTrades.filter((t) => t.date >= weekStart && (t.result === "win" || t.result === "loss")).length;
  const weekWinRate = weekDecided > 0 ? round2((weekWins / weekDecided) * 100) : null;

  const monthWins = allTrades.filter((t) => t.date >= monthStart && t.result === "win").length;
  const monthDecided = allTrades.filter((t) => t.date >= monthStart && (t.result === "win" || t.result === "loss")).length;
  const monthWinRate = monthDecided > 0 ? round2((monthWins / monthDecided) * 100) : null;

  const allTimePnl = round2(allTimePnlAgg._sum.pnl ?? 0);
  const lastMonthPnl = round2(lastMonthAgg._sum.pnl ?? 0);
  const lastMonthTrades = lastMonthAgg._count._all;

  return NextResponse.json({
    todayPnl: round2(todayPnl),
    weekPnl: round2(weekPnl),
    monthPnl: round2(monthPnl),
    yearPnl: round2(yearPnl),
    lastMonthPnl,
    lastMonthTrades,
    allTimePnl,
    weekTrades,
    monthTrades,
    yearTrades,
    weekWinRate,
    monthWinRate,
    streak,
    streakType,
    miniHeatmap,
    recentTrades: recentTrades.map((t) => ({
      id: t.id,
      date: t.date.toISOString().slice(0, 10),
      instrument: t.instrument,
      direction: t.direction,
      pnl: round2(t.pnl),
      result: t.result,
      grade: t.grade,
      strategyName: t.strategy?.name ?? "—",
    })),
  });
}
