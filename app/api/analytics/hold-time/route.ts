import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const BUCKETS = ["< 15m", "15–30m", "30m–1h", "1–2h", "2h+"] as const;
type BucketLabel = (typeof BUCKETS)[number];

function parseMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function holdMinutes(entry: string, exit: string): number {
  const e = parseMinutes(entry);
  const x = parseMinutes(exit);
  return x >= e ? x - e : x - e + 24 * 60;
}

function getBucket(mins: number): BucketLabel {
  if (mins < 15) return "< 15m";
  if (mins < 30) return "15–30m";
  if (mins < 60) return "30m–1h";
  if (mins < 120) return "1–2h";
  return "2h+";
}

type BucketAcc = {
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
  rValues: number[];
};

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: { userId: token.sub, archived: false },
    select: { entryTime: true, exitTime: true, pnl: true, result: true, riskAmount: true },
  });

  const acc: Record<BucketLabel, BucketAcc> = {
    "< 15m":    { trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] },
    "15–30m":   { trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] },
    "30m–1h":   { trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] },
    "1–2h":     { trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] },
    "2h+":      { trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] },
  };

  for (const t of trades) {
    if (!t.entryTime || !t.exitTime) continue;
    const mins = holdMinutes(t.entryTime, t.exitTime);
    const b = getBucket(mins);
    acc[b].trades++;
    acc[b].pnl += t.pnl;
    if (t.result === "win") acc[b].wins++;
    else if (t.result === "loss") acc[b].losses++;
    if (t.riskAmount > 0) acc[b].rValues.push(t.pnl / t.riskAmount);
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const result = BUCKETS.map((label) => {
    const b = acc[label];
    const winRate = b.trades > 0 ? round2((b.wins / b.trades) * 100) : 0;
    const avgPnl = b.trades > 0 ? round2(b.pnl / b.trades) : 0;
    const avgR =
      b.rValues.length > 0
        ? round2(b.rValues.reduce((s, v) => s + v, 0) / b.rValues.length)
        : 0;
    return {
      label,
      trades: b.trades,
      wins: b.wins,
      losses: b.losses,
      winRate,
      pnl: round2(b.pnl),
      avgPnl,
      avgR,
    };
  });

  return NextResponse.json(result);
}
