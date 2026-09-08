import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const BUCKETS = [
  "< -2R",
  "-2R to -1R",
  "-1R to 0R",
  "0R to 1R",
  "1R to 2R",
  "2R to 3R",
  "> 3R",
] as const;

type BucketName = (typeof BUCKETS)[number];

function getBucket(r: number): BucketName {
  if (r < -2) return "< -2R";
  if (r < -1) return "-2R to -1R";
  if (r < 0) return "-1R to 0R";
  if (r < 1) return "0R to 1R";
  if (r < 2) return "1R to 2R";
  if (r < 3) return "2R to 3R";
  return "> 3R";
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: { userId: token.sub, archived: false },
    select: { pnl: true, riskAmount: true, result: true },
  });

  const bucketMap: Record<BucketName, { count: number; pnl: number }> = {
    "< -2R": { count: 0, pnl: 0 },
    "-2R to -1R": { count: 0, pnl: 0 },
    "-1R to 0R": { count: 0, pnl: 0 },
    "0R to 1R": { count: 0, pnl: 0 },
    "1R to 2R": { count: 0, pnl: 0 },
    "2R to 3R": { count: 0, pnl: 0 },
    "> 3R": { count: 0, pnl: 0 },
  };

  for (const t of trades) {
    const r = t.riskAmount > 0 ? t.pnl / t.riskAmount : 0;
    const bucket = getBucket(r);
    bucketMap[bucket].count++;
    bucketMap[bucket].pnl += t.pnl;
  }

  const result = BUCKETS.map((bucket) => ({
    bucket,
    count: bucketMap[bucket].count,
    pnl: Math.round(bucketMap[bucket].pnl * 100) / 100,
  }));

  return NextResponse.json(result);
}
