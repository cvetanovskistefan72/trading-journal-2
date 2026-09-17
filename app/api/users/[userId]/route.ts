import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type Params = Promise<{ userId: string }>;

export async function PATCH(req: NextRequest, context: { params: Params }) {
  const { userId } = await context.params;

  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));

  if (typeof body.dailyTradeLimit === "number") {
    const limit = Math.max(1, Math.min(2000, Math.round(body.dailyTradeLimit)));
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { dailyTradeLimit: limit },
      select: { id: true, dailyTradeLimit: true },
    });
    return NextResponse.json(updated);
  }

  if (typeof body.testFlag === "boolean") {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { testFlag: body.testFlag },
      select: { id: true, testFlag: true },
    });
    return NextResponse.json(updated);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { disabled: !user.disabled },
    select: { id: true, disabled: true },
  });

  return NextResponse.json(updated);
}
