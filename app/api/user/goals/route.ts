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

  // Only fetch what the active goals actually need
  const needsWeek  = types.has("WEEKLY_PROFIT")  || types.has("WEEKLY_TRADE_COUNT");
  const needsMonth = types.has("MONTHLY_PROFIT") || types.has("MONTHLY_TRADE_COUNT") || types.has("WIN_RATE");
  const needsYear  = types.has("YEARLY_PROFIT");
  const needsDD    = types.has("MAX_DRAWDOWN");
  const needsWR    = types.has("WIN_RATE");

  const [weekAgg, monthAgg, yearAgg, ddTrades] = await Promise.all([
    needsWeek ? prisma.trade.aggregate({
      where: { userId: user.id, archived: false, date: { gte: weekStart } },
      _sum: { pnl: true }, _count: { _all: true },
    }) : null,
    needsMonth ? prisma.trade.aggregate({
      where: { userId: user.id, archived: false, date: { gte: monthStart } },
      _sum: { pnl: true }, _count: { _all: true },
    }) : null,
    needsYear ? prisma.trade.aggregate({
      where: { userId: user.id, archived: false, date: { gte: yearStart } },
      _sum: { pnl: true },
    }) : null,
    needsDD ? prisma.trade.findMany({
      where: { userId: user.id, archived: false },
      select: { pnl: true },
      orderBy: { date: "asc" },
    }) : null,
  ]);

  // Win rate — all time
  let allWins = 0, allDecided = 0;
  if (needsWR) {
    const [w, d] = await Promise.all([
      prisma.trade.count({ where: { userId: user.id, archived: false, result: "win" } }),
      prisma.trade.count({ where: { userId: user.id, archived: false, result: { in: ["win", "loss"] } } }),
    ]);
    allWins = w; allDecided = d;
  }

  // Current drawdown from year equity curve
  let currentDrawdown = 0;
  if (ddTrades) {
    let running = 0, peak = 0;
    for (const t of ddTrades) {
      running += t.pnl;
      if (running > peak) peak = running;
      const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
      if (dd > currentDrawdown) currentDrawdown = dd;
    }
  }

  const current: Record<string, number> = {
    WEEKLY_PROFIT:       weekAgg?._sum.pnl ?? 0,
    MONTHLY_PROFIT:      monthAgg?._sum.pnl ?? 0,
    YEARLY_PROFIT:       yearAgg?._sum.pnl ?? 0,
    WEEKLY_TRADE_COUNT:  weekAgg?._count._all ?? 0,
    MONTHLY_TRADE_COUNT: monthAgg?._count._all ?? 0,
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
