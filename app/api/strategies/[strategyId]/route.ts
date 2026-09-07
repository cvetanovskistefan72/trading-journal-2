import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = Promise<{ strategyId: string }>;

async function getOwnedStrategy(strategyId: string, userId: string) {
  return prisma.strategy.findFirst({ where: { id: strategyId, userId } });
}

export async function GET(_req: NextRequest, context: { params: Params }) {
  const { strategyId } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const strategy = await getOwnedStrategy(strategyId, user.id);
  if (!strategy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(strategy);
}

export async function PATCH(req: NextRequest, context: { params: Params }) {
  const { strategyId } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getOwnedStrategy(strategyId, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, description, confluences, questions } = await req.json();

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }

  const strategy = await prisma.strategy.update({
    where: { id: strategyId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
      ...(confluences !== undefined && {
        confluences: Array.isArray(confluences)
          ? confluences.filter((c: unknown) => typeof c === "string" && c.trim())
          : [],
      }),
      ...(questions !== undefined && { questions: Array.isArray(questions) ? questions : [] }),
    },
  });

  return NextResponse.json(strategy);
}

export async function DELETE(_req: NextRequest, context: { params: Params }) {
  const { strategyId } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getOwnedStrategy(strategyId, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tradeCount = await prisma.trade.count({ where: { strategyId } });
  if (tradeCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete strategy with ${tradeCount} trade${tradeCount !== 1 ? "s" : ""} attached to it.` },
      { status: 409 }
    );
  }

  await prisma.strategy.delete({ where: { id: strategyId } });

  return NextResponse.json({ success: true });
}
