import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

type Params = Promise<{ userId: string }>;

export async function PATCH(_req: NextRequest, context: { params: Params }) {
  const { userId } = await context.params;

  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { disabled: !user.disabled },
    select: { id: true, disabled: true },
  });

  return NextResponse.json(updated);
}
