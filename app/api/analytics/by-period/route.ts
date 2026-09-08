import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") === "weekly" ? "weekly" : "monthly";
  const from = searchParams.get("from");

  const trades = await prisma.trade.findMany({
    where: {
      userId: token.sub,
      archived: false,
      ...(from ? { date: { gte: new Date(from) } } : {}),
    },
    select: { date: true, pnl: true, result: true },
    orderBy: { date: "asc" },
  });

  const buckets = new Map<string, { pnl: number; wins: number; losses: number }>();

  for (const t of trades) {
    let key: string;
    if (mode === "monthly") {
      key = t.date.toISOString().slice(0, 7); // YYYY-MM
    } else {
      // ISO week: YYYY-Www
      const d = new Date(t.date);
      const jan4 = new Date(d.getFullYear(), 0, 4);
      const week = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);
      key = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
    }
    const b = buckets.get(key) ?? { pnl: 0, wins: 0, losses: 0 };
    b.pnl += t.pnl;
    if (t.result === "win") b.wins++;
    else if (t.result === "loss") b.losses++;
    buckets.set(key, b);
  }

  const data = Array.from(buckets.entries()).map(([period, b]) => ({
    period,
    pnl: Math.round(b.pnl * 100) / 100,
    wins: b.wins,
    losses: b.losses,
  }));

  return NextResponse.json(data);
}
