import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveAccount } from "@/lib/getActiveAccount";
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

  const accountId = await getActiveAccount(user.id);
  if (!accountId) return NextResponse.json({ error: "No account found" }, { status: 404 });

  const goals = await prisma.goal.findMany({
    where: { accountId },
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

  const [yearTrades, preYearTrades] = await Promise.all([
    prisma.trade.findMany({
      where: { accountId, archived: false, date: { gte: yearStart } },
      select: { date: true, pnl: true, result: true },
      orderBy: { date: "asc" },
    }),
    needsDD ? prisma.trade.findMany({
      where: { accountId, archived: false, date: { lt: yearStart } },
      select: { pnl: true },
      orderBy: { date: "asc" },
    }) : null,
  ]);

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

  const accountId = await getActiveAccount(user.id);
  if (!accountId) return NextResponse.json({ error: "No account found" }, { status: 404 });

  const body = await req.json();
  const { type, value } = body;

  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "Invalid goal type" }, { status: 400 });
  if (typeof value !== "number" || value <= 0) return NextResponse.json({ error: "Invalid value" }, { status: 400 });

  const goal = await prisma.goal.upsert({
    where: { accountId_type: { accountId, type } },
    update: { value },
    create: { accountId, type, value },
    select: { id: true, type: true, value: true },
  });

  return NextResponse.json(goal);
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = await getActiveAccount(user.id);
  if (!accountId) return NextResponse.json({ error: "No account found" }, { status: 404 });

  const { type } = await req.json();
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "Invalid goal type" }, { status: 400 });

  await prisma.goal.deleteMany({ where: { accountId, type } });

  return NextResponse.json({ ok: true });
}
