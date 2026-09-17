import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GoalType } from "@prisma/client";

const VALID_TYPES = Object.values(GoalType);

const TYPE_ORDER: Record<string, number> = {
  YEARLY_PROFIT: 0,
  MONTHLY_PROFIT: 1,
  WEEKLY_PROFIT: 2,
  MONTHLY_TRADE_COUNT: 3,
  WEEKLY_TRADE_COUNT: 4,
  WIN_RATE: 5,
  MAX_DRAWDOWN: 6,
};

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfYear(d: Date)  { return new Date(d.getFullYear(), 0, 1); }

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    select: { id: true, type: true, value: true },
  });

  goals.sort((a, b) => (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99));

  if (goals.length === 0) return NextResponse.json([]);

  const now = new Date();
  const weekStart  = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const yearStart  = startOfYear(now);

  const types = new Set(goals.map((g) => g.type));
  const needsDD = types.has("MAX_DRAWDOWN");

  // 2 queries in parallel:
  // 1. Year trades — covers week/month/year PnL, trade counts, win rate, drawdown
  // 2. Pre-year trades (pnl only) — only if MAX_DRAWDOWN is set (need full history)
  const [yearTrades, preYearTrades] = await Promise.all([
    prisma.trade.findMany({
      where: { userId: user.id, archived: false, date: { gte: yearStart } },
      select: { date: true, pnl: true, result: true },
      orderBy: { date: "asc" },
    }),
    needsDD ? prisma.trade.findMany({
      where: { userId: user.id, archived: false, date: { lt: yearStart } },
      select: { pnl: true },
      orderBy: { date: "asc" },
    }) : null,
  ]);

  // Single pass over yearTrades for all stats
  let weekPnl = 0, monthPnl = 0, yearPnl = 0;
  let weekCount = 0, monthCount = 0;
  let allWins = 0, allDecided = 0;

  for (const t of yearTrades) {
    const d = t.date;
    if (d >= weekStart)  { weekPnl += t.pnl; weekCount++; }
    if (d >= monthStart) { monthPnl += t.pnl; monthCount++; }
    yearPnl += t.pnl;
    if (t.result === "win")  { allWins++; allDecided++; }
    else if (t.result === "loss") allDecided++;
  }

  // Drawdown — full history if needed
  let currentDrawdown = 0;
  if (needsDD) {
    const allTrades = [...(preYearTrades ?? []), ...yearTrades];
    let running = 0, peak = 0;
    for (const t of allTrades) {
      running += t.pnl;
      if (running > peak) peak = running;
      const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
      if (dd > currentDrawdown) currentDrawdown = dd;
    }
  }

  const current: Record<string, number> = {
    WEEKLY_PROFIT:       weekPnl,
    MONTHLY_PROFIT:      monthPnl,
    YEARLY_PROFIT:       yearPnl,
    WEEKLY_TRADE_COUNT:  weekCount,
    MONTHLY_TRADE_COUNT: monthCount,
    WIN_RATE:            allDecided > 0 ? Math.round((allWins / allDecided) * 1000) / 10 : 0,
    MAX_DRAWDOWN:        Math.round(currentDrawdown * 100) / 100,
  };

  return NextResponse.json(goals.map((g) => ({ ...g, current: current[g.type] ?? 0 })));
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, value } = body;

  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "Invalid goal type" }, { status: 400 });
  if (typeof value !== "number" || value <= 0) return NextResponse.json({ error: "Invalid value" }, { status: 400 });

  const goal = await prisma.goal.upsert({
    where: { userId_type: { userId: user.id, type } },
    update: { value },
    create: { userId: user.id, type, value },
    select: { id: true, type: true, value: true },
  });

  return NextResponse.json(goal);
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await req.json();
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "Invalid goal type" }, { status: 400 });

  await prisma.goal.deleteMany({ where: { userId: user.id, type } });

  return NextResponse.json({ ok: true });
}
