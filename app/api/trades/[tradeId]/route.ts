import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { gradeToOrder } from "@/app/api/trades/route";

type Params = Promise<{ tradeId: string }>;

export async function DELETE(_req: NextRequest, context: { params: Params }) {
  const { tradeId } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trade = await prisma.trade.findFirst({ where: { id: tradeId, userId: user.id } });
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!trade.archived) {
    return NextResponse.json({ error: "Only archived trades can be deleted." }, { status: 409 });
  }

  await prisma.trade.delete({ where: { id: tradeId } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, context: { params: Params }) {
  const { tradeId } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trade = await prisma.trade.findFirst({ where: { id: tradeId, userId: user.id } });
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const {
    strategyId, date, instrument, direction, session,
    entryTime, exitTime, result, pnl, riskAmount,
    grade, confluences, answers, notes, archived,
  } = body;

  const updated = await prisma.trade.update({
    where: { id: tradeId },
    data: {
      ...(strategyId !== undefined && { strategyId }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(instrument !== undefined && { instrument }),
      ...(direction !== undefined && { direction }),
      ...(session !== undefined && { session }),
      ...(entryTime !== undefined && { entryTime }),
      ...(exitTime !== undefined && { exitTime }),
      ...(result !== undefined && { result }),
      ...(pnl !== undefined && { pnl: Number(pnl) }),
      ...(riskAmount !== undefined && { riskAmount: Number(riskAmount) }),
      ...(grade !== undefined && { grade, gradeOrder: gradeToOrder(grade) }),
      ...(confluences !== undefined && { confluences }),
      ...(answers !== undefined && { answers }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(archived !== undefined && { archived: Boolean(archived) }),
    },
    include: { strategy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}
