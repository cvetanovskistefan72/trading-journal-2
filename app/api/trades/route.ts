import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

const GRADE_ORDER = ["B", "B+", "A-", "A", "A+", "A+++"];
const LIMIT = 10;

export function gradeToOrder(grade: string): number {
  const idx = GRADE_ORDER.indexOf(grade);
  return idx === -1 ? 0 : idx;
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "date";
  const sortDir = (searchParams.get("sortDir") ?? "desc") as "asc" | "desc";
  const search = searchParams.get("search")?.trim() ?? "";
  const strategyId = searchParams.get("strategyId") ?? "";
  const archivedParam = searchParams.get("archived");
  const archived = archivedParam === "true" ? true : false;

  const dateFilter: Prisma.DateTimeFilter = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    dateFilter.lte = to;
  }

  const where: Prisma.TradeWhereInput = { userId: user.id, archived };
  if (dateFrom || dateTo) where.date = dateFilter;
  if (strategyId) where.strategyId = strategyId;
  if (search) {
    where.OR = [
      { instrument: { contains: search, mode: "insensitive" } },
      { direction: { contains: search, mode: "insensitive" } },
      { session: { contains: search, mode: "insensitive" } },
      { result: { contains: search, mode: "insensitive" } },
      { grade: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      { strategy: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const orderBy: Prisma.TradeOrderByWithRelationInput =
    sortBy === "grade" ? { gradeOrder: sortDir } :
    sortBy === "pnl"   ? { pnl: sortDir } :
                         { date: sortDir };

  const [total, trades] = await prisma.$transaction([
    prisma.trade.count({ where }),
    prisma.trade.findMany({
      where,
      include: { strategy: { select: { id: true, name: true } } },
      orderBy,
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
  ]);

  return NextResponse.json({
    trades,
    total,
    page,
    totalPages: Math.ceil(total / LIMIT),
    limit: LIMIT,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    strategyId, date, instrument, direction, session,
    entryTime, exitTime, result, pnl, riskAmount,
    grade, confluences, answers, notes,
  } = body;

  if (!strategyId || !date || !instrument || !direction || !session ||
      !entryTime || !exitTime || !result || pnl === undefined ||
      riskAmount === undefined || !grade) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const strategy = await prisma.strategy.findFirst({ where: { id: strategyId, userId: user.id } });
  if (!strategy) return NextResponse.json({ error: "Strategy not found" }, { status: 404 });

  const trade = await prisma.trade.create({
    data: {
      userId: user.id,
      strategyId,
      date: new Date(date),
      instrument,
      direction,
      session,
      entryTime,
      exitTime,
      result,
      pnl: Number(pnl),
      riskAmount: Number(riskAmount),
      grade,
      gradeOrder: gradeToOrder(grade),
      confluences: Array.isArray(confluences) ? confluences : [],
      answers: Array.isArray(answers) ? answers : [],
      notes: notes?.trim() || null,
    },
    include: { strategy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(trade, { status: 201 });
}
