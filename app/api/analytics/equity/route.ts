import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from");

  const trades = await prisma.trade.findMany({
    where: {
      userId: token.sub,
      archived: false,
      ...(from ? { date: { gte: new Date(from) } } : {}),
    },
    select: { date: true, pnl: true },
    orderBy: { date: "asc" },
  });

  let cumulative = 0;
  const points = trades.map((t) => {
    cumulative += t.pnl;
    return {
      date: t.date.toISOString().slice(0, 10),
      pnl: Math.round(t.pnl * 100) / 100,
      cumulative: Math.round(cumulative * 100) / 100,
    };
  });

  return NextResponse.json(points);
}
