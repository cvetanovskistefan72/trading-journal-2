import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveAccount } from "@/lib/getActiveAccount";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = await getActiveAccount(user.id);
  if (!accountId) return NextResponse.json({ error: "No account found" }, { status: 404 });

  const strategies = await prisma.strategy.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(strategies);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = await getActiveAccount(user.id);
  if (!accountId) return NextResponse.json({ error: "No account found" }, { status: 404 });

  const { name, description, confluences, questions } = await req.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const strategy = await prisma.strategy.create({
    data: {
      accountId,
      name: name.trim(),
      description: description?.trim() ?? null,
      confluences: Array.isArray(confluences) ? confluences.filter((c: unknown) => typeof c === "string" && c.trim()) : [],
      questions: Array.isArray(questions) ? questions : [],
    },
  });

  return NextResponse.json(strategy, { status: 201 });
}
