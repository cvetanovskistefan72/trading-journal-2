import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: { userId: token.sub, archived: false },
    select: { date: true, pnl: true, result: true },
  });

  const buckets = DAYS.map((day) => ({ day, pnl: 0, wins: 0, losses: 0, trades: 0 }));

  for (const t of trades) {
    const dow = new Date(t.date).getDay();
    buckets[dow].pnl += t.pnl;
    buckets[dow].trades++;
    if (t.result === "win") buckets[dow].wins++;
    else if (t.result === "loss") buckets[dow].losses++;
  }

  return NextResponse.json(
    buckets.map((b) => ({ ...b, pnl: Math.round(b.pnl * 100) / 100 }))
  );
}
