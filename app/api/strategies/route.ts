import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const strategies = await prisma.strategy.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(strategies);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, confluences, questions } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const strategy = await prisma.strategy.create({
    data: {
      userId: user.id,
      name: name.trim(),
      description: description?.trim() ?? null,
      confluences: Array.isArray(confluences) ? confluences.filter((c: unknown) => typeof c === "string" && c.trim()) : [],
      questions: Array.isArray(questions) ? questions : [],
    },
  });

  return NextResponse.json(strategy, { status: 201 });
}
