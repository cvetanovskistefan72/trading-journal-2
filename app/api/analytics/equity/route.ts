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

  // Aggregate by day first
  const dayMap = new Map<string, number>();
  for (const t of trades) {
    const key = t.date.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + t.pnl);
  }

  const days = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Auto-downsample: > 90 days → weekly buckets, > 365 days → monthly buckets
  const spanDays = days.length > 0
    ? (new Date(days[days.length - 1][0]).getTime() - new Date(days[0][0]).getTime()) / 86400000
    : 0;

  let buckets: Map<string, number>;
  if (spanDays > 365) {
    buckets = new Map<string, number>();
    for (const [date, pnl] of days) {
      const key = date.slice(0, 7); // YYYY-MM
      buckets.set(key, (buckets.get(key) ?? 0) + pnl);
    }
  } else if (spanDays > 90) {
    buckets = new Map<string, number>();
    for (const [date, pnl] of days) {
      const d = new Date(date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + pnl);
    }
  } else {
    buckets = new Map(days);
  }

  let cumulative = 0;
  const points = Array.from(buckets.entries()).map(([date, pnl]) => {
    cumulative += pnl;
    return { date, cumulative: Math.round(cumulative * 100) / 100 };
  });

  return NextResponse.json(points);
}
