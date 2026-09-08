import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: { userId: token.sub, archived: false },
    select: { pnl: true, result: true, riskAmount: true },
  });

  const total = trades.length;
  const wins = trades.filter((t) => t.result === "win");
  const losses = trades.filter((t) => t.result === "loss");

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss === 0 ? (grossWin > 0 ? Infinity : 0) : grossWin / grossLoss;

  const avgWin = wins.length > 0 ? grossWin / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

  const avgR =
    trades.length > 0
      ? trades.reduce((s, t) => s + (t.riskAmount > 0 ? t.pnl / t.riskAmount : 0), 0) / trades.length
      : 0;

  return NextResponse.json({
    total,
    wins: wins.length,
    losses: losses.length,
    winRate: total > 0 ? (wins.length / total) * 100 : 0,
    totalPnl: Math.round(totalPnl * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    avgR: Math.round(avgR * 100) / 100,
  });
}
