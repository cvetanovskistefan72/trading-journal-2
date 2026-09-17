import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const round2 = (n: number) => Math.round(n * 100) / 100;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
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
  const yearStart = startOfYear(now);
  const lastMonthStart = startOfLastMonth(now);
  const lastMonthEnd = endOfLastMonth(now);

  // 3 queries in parallel — 1 connection each, no sequential batches
  const [allTimePnlAgg, recentTrades, periodTrades] = await Promise.all([
    // 1. All-time sum — aggregate only, zero rows transferred
    prisma.trade.aggregate({
      where: { userId: token.sub, archived: false },
      _sum: { pnl: true },
    }),
    // 2. Last 10 trades for the recent trades table
    prisma.trade.findMany({
      where: { userId: token.sub, archived: false },
      select: {
        id: true, date: true, instrument: true, direction: true,
        pnl: true, result: true, grade: true,
        strategy: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 10,
    }),
    // 3. Last month + this month trades — covers today/week/month/lastMonth/streak/winRate/year
    prisma.trade.findMany({
      where: { userId: token.sub, archived: false, date: { gte: lastMonthStart } },
      select: { date: true, pnl: true, result: true },
      orderBy: { date: "asc" },
    }),
  ]);

  // Compute all stats from periodTrades in a single pass
  let todayPnl = 0, weekPnl = 0, monthPnl = 0, yearPnl = 0, lastMonthPnl = 0;
  let weekTradeCount = 0, monthTradeCount = 0, yearTradeCount = 0, lastMonthTradeCount = 0;
  let weekWins = 0, weekDecided = 0, monthWins = 0, monthDecided = 0;
  const streakCandidates: { result: string }[] = [];

  for (const t of periodTrades) {
    const d = t.date;
    const isLastMonth = d >= lastMonthStart && d <= lastMonthEnd;
    const isThisMonth = d >= monthStart;
    const isThisWeek = d >= weekStart;
    const isToday = d >= todayStart;
    const isThisYear = d >= yearStart;

    if (isLastMonth) { lastMonthPnl += t.pnl; lastMonthTradeCount++; }
    if (isThisMonth) { monthPnl += t.pnl; monthTradeCount++; }
    if (isThisWeek)  { weekPnl += t.pnl; weekTradeCount++; }
    if (isToday)       todayPnl += t.pnl;
    if (isThisYear)  { yearPnl += t.pnl; yearTradeCount++; }

    if (isThisWeek && (t.result === "win" || t.result === "loss")) {
      weekDecided++;
      if (t.result === "win") weekWins++;
    }
    if (isThisMonth && (t.result === "win" || t.result === "loss")) {
      monthDecided++;
      if (t.result === "win") monthWins++;
    }

    if (t.result === "win" || t.result === "loss") streakCandidates.push(t);
  }

  // Streak — streakCandidates is asc, reverse for most-recent-first
  let streak = 0;
  let streakType: "win" | "loss" | null = null;
  const reversed = streakCandidates.slice().reverse();
  if (reversed.length > 0) {
    streakType = reversed[0].result as "win" | "loss";
    for (const t of reversed) {
      if (t.result === streakType) streak++;
      else break;
    }
  }

  const weekWinRate = weekDecided > 0 ? round2((weekWins / weekDecided) * 100) : null;
  const monthWinRate = monthDecided > 0 ? round2((monthWins / monthDecided) * 100) : null;

  return NextResponse.json({
    todayPnl:        round2(todayPnl),
    weekPnl:         round2(weekPnl),
    monthPnl:        round2(monthPnl),
    yearPnl:         round2(yearPnl),
    allTimePnl:      round2(allTimePnlAgg._sum.pnl ?? 0),
    lastMonthPnl:    round2(lastMonthPnl),
    lastMonthTrades: lastMonthTradeCount,
    weekTrades:      weekTradeCount,
    monthTrades:     monthTradeCount,
    yearTrades:      yearTradeCount,
    weekWinRate,
    monthWinRate,
    streak,
    streakType,
    recentTrades: recentTrades.map(t => ({
      id:           t.id,
      date:         t.date.toISOString().slice(0, 10),
      instrument:   t.instrument,
      direction:    t.direction,
      pnl:          round2(t.pnl),
      result:       t.result,
      grade:        t.grade,
      strategyName: t.strategy?.name ?? "—",
    })),
  });
}
