import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GoalType } from "@prisma/client";

const VALID_TYPES = Object.values(GoalType);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const TYPE_ORDER: Record<string, number> = {
    YEARLY_PROFIT: 0,
    MONTHLY_PROFIT: 1,
    WEEKLY_PROFIT: 2,
    MONTHLY_TRADE_COUNT: 3,
    WEEKLY_TRADE_COUNT: 4,
    WIN_RATE: 5,
    MAX_DRAWDOWN: 6,
  };

  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    select: { id: true, type: true, value: true },
  });

  goals.sort((a, b) => (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99));

  return NextResponse.json(goals);
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
