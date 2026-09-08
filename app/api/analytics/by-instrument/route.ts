import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: { userId: token.sub, archived: false },
    select: { instrument: true, pnl: true, result: true, riskAmount: true },
  });

  const map = new Map<
    string,
    { pnl: number; trades: number; wins: number; losses: number; rValues: number[] }
  >();

  for (const t of trades) {
    const bucket = map.get(t.instrument) ?? {
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      rValues: [],
    };

    bucket.pnl += t.pnl;
    bucket.trades++;
    if (t.result === "win") bucket.wins++;
    else if (t.result === "loss") bucket.losses++;
    if (t.riskAmount > 0) bucket.rValues.push(t.pnl / t.riskAmount);

    map.set(t.instrument, bucket);
  }

  const data = Array.from(map.entries())
    .map(([instrument, b]) => {
      const avgR =
        b.rValues.length > 0
          ? b.rValues.reduce((sum, v) => sum + v, 0) / b.rValues.length
          : 0;
      const winRate = b.trades > 0 ? (b.wins / b.trades) * 100 : 0;

      return {
        instrument,
        pnl: Math.round(b.pnl * 100) / 100,
        trades: b.trades,
        wins: b.wins,
        losses: b.losses,
        winRate: Math.round(winRate * 10) / 10,
        avgR: Math.round(avgR * 100) / 100,
      };
    })
    .sort((a, b) => b.pnl - a.pnl);

  return NextResponse.json(data);
}
