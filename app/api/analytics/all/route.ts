import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const R_BUCKETS = ["< -2R", "-2R to -1R", "-1R to 0R", "0R to 1R", "1R to 2R", "2R to 3R", "> 3R"] as const;
const HOLD_BUCKETS = ["< 15m", "15–30m", "30m–1h", "1–2h", "2h+"] as const;

type RBucket = (typeof R_BUCKETS)[number];
type HoldBucket = (typeof HOLD_BUCKETS)[number];

const round2 = (n: number) => Math.round(n * 100) / 100;

function getRBucket(r: number): RBucket {
  if (r < -2) return "< -2R";
  if (r < -1) return "-2R to -1R";
  if (r < 0) return "-1R to 0R";
  if (r < 1) return "0R to 1R";
  if (r < 2) return "1R to 2R";
  if (r < 3) return "2R to 3R";
  return "> 3R";
}

function parseMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function holdMinutes(entry: string, exit: string) {
  const e = parseMinutes(entry);
  const x = parseMinutes(exit);
  return x >= e ? x - e : x - e + 24 * 60;
}

function getHoldBucket(mins: number): HoldBucket {
  if (mins < 15) return "< 15m";
  if (mins < 30) return "15–30m";
  if (mins < 60) return "30m–1h";
  if (mins < 120) return "1–2h";
  return "2h+";
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");

  // ONE query — all fields needed for every chart
  const trades = await prisma.trade.findMany({
    where: {
      userId: token.sub,
      archived: false,
      ...(from ? { date: { gte: new Date(from) } } : {}),
    },
    select: {
      date: true,
      pnl: true,
      result: true,
      riskAmount: true,
      instrument: true,
      session: true,
      entryTime: true,
      exitTime: true,
    },
    orderBy: { date: "asc" },
  });

  // ── EQUITY CURVE ──────────────────────────────────────────────
  const dayMap = new Map<string, number>();
  for (const t of trades) {
    const key = t.date.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + t.pnl);
  }
  const days = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  const spanDays = days.length > 0
    ? (new Date(days[days.length - 1][0]).getTime() - new Date(days[0][0]).getTime()) / 86400000
    : 0;

  let equityBuckets: Map<string, number>;
  if (spanDays > 365) {
    equityBuckets = new Map();
    for (const [date, pnl] of days) {
      const key = date.slice(0, 7);
      equityBuckets.set(key, (equityBuckets.get(key) ?? 0) + pnl);
    }
  } else if (spanDays > 90) {
    equityBuckets = new Map();
    for (const [date, pnl] of days) {
      const d = new Date(date);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().slice(0, 10);
      equityBuckets.set(key, (equityBuckets.get(key) ?? 0) + pnl);
    }
  } else {
    equityBuckets = new Map(days);
  }

  let cumulative = 0;
  const equity = Array.from(equityBuckets.entries()).map(([date, pnl]) => {
    cumulative += pnl;
    return { date, cumulative: round2(cumulative) };
  });

  // ── SUMMARY ───────────────────────────────────────────────────
  const wins = trades.filter((t) => t.result === "win");
  const losses = trades.filter((t) => t.result === "loss");
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss === 0 ? (grossWin > 0 ? Infinity : 0) : grossWin / grossLoss;
  const avgR = trades.length > 0
    ? trades.reduce((s, t) => s + (t.riskAmount > 0 ? t.pnl / t.riskAmount : 0), 0) / trades.length
    : 0;

  const summary = {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
    totalPnl: round2(totalPnl),
    profitFactor: round2(profitFactor),
    avgWin: round2(wins.length > 0 ? grossWin / wins.length : 0),
    avgLoss: round2(losses.length > 0 ? grossLoss / losses.length : 0),
    avgR: round2(avgR),
  };

  // ── BY WEEKDAY ────────────────────────────────────────────────
  const dowBuckets = DAYS.map((day) => ({ day, pnl: 0, wins: 0, losses: 0, trades: 0 }));
  for (const t of trades) {
    const dow = new Date(t.date).getDay();
    dowBuckets[dow].pnl += t.pnl;
    dowBuckets[dow].trades++;
    if (t.result === "win") dowBuckets[dow].wins++;
    else if (t.result === "loss") dowBuckets[dow].losses++;
  }
  const byWeekday = dowBuckets.map((b) => ({ ...b, pnl: round2(b.pnl) }));

  // ── R-MULTIPLE ────────────────────────────────────────────────
  const rMap: Record<RBucket, { count: number; pnl: number }> = {
    "< -2R": { count: 0, pnl: 0 }, "-2R to -1R": { count: 0, pnl: 0 },
    "-1R to 0R": { count: 0, pnl: 0 }, "0R to 1R": { count: 0, pnl: 0 },
    "1R to 2R": { count: 0, pnl: 0 }, "2R to 3R": { count: 0, pnl: 0 }, "> 3R": { count: 0, pnl: 0 },
  };
  for (const t of trades) {
    const r = t.riskAmount > 0 ? t.pnl / t.riskAmount : 0;
    const b = getRBucket(r);
    rMap[b].count++;
    rMap[b].pnl += t.pnl;
  }
  const rMultiple = R_BUCKETS.map((bucket) => ({
    bucket, count: rMap[bucket].count, pnl: round2(rMap[bucket].pnl),
  }));

  // ── HOLD TIME ─────────────────────────────────────────────────
  type HoldAcc = { trades: number; wins: number; losses: number; pnl: number; rValues: number[] };
  const holdAcc: Record<HoldBucket, HoldAcc> = {
    "< 15m":  { trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] },
    "15–30m": { trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] },
    "30m–1h": { trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] },
    "1–2h":   { trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] },
    "2h+":    { trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] },
  };
  for (const t of trades) {
    if (!t.entryTime || !t.exitTime) continue;
    const b = getHoldBucket(holdMinutes(t.entryTime, t.exitTime));
    holdAcc[b].trades++;
    holdAcc[b].pnl += t.pnl;
    if (t.result === "win") holdAcc[b].wins++;
    else if (t.result === "loss") holdAcc[b].losses++;
    if (t.riskAmount > 0) holdAcc[b].rValues.push(t.pnl / t.riskAmount);
  }
  const holdTime = HOLD_BUCKETS.map((label) => {
    const b = holdAcc[label];
    return {
      label,
      trades: b.trades,
      wins: b.wins,
      losses: b.losses,
      winRate: b.trades > 0 ? round2((b.wins / b.trades) * 100) : 0,
      pnl: round2(b.pnl),
      avgPnl: b.trades > 0 ? round2(b.pnl / b.trades) : 0,
      avgR: b.rValues.length > 0 ? round2(b.rValues.reduce((s, v) => s + v, 0) / b.rValues.length) : 0,
    };
  });

  // ── BY SESSION ────────────────────────────────────────────────
  const sessionMap = new Map<string, { pnl: number; trades: number; wins: number; losses: number; rValues: number[] }>();
  for (const t of trades) {
    const b = sessionMap.get(t.session) ?? { pnl: 0, trades: 0, wins: 0, losses: 0, rValues: [] };
    b.pnl += t.pnl; b.trades++;
    if (t.result === "win") b.wins++;
    else if (t.result === "loss") b.losses++;
    if (t.riskAmount > 0) b.rValues.push(t.pnl / t.riskAmount);
    sessionMap.set(t.session, b);
  }
  const bySession = Array.from(sessionMap.entries()).map(([session, b]) => ({
    session,
    pnl: round2(b.pnl),
    trades: b.trades,
    wins: b.wins,
    losses: b.losses,
    winRate: round2(b.trades > 0 ? (b.wins / b.trades) * 100 : 0),
    avgR: round2(b.rValues.length > 0 ? b.rValues.reduce((s, v) => s + v, 0) / b.rValues.length : 0),
  })).sort((a, b) => b.pnl - a.pnl);

  // ── BY INSTRUMENT ─────────────────────────────────────────────
  const instrMap = new Map<string, { pnl: number; trades: number; wins: number; losses: number; rValues: number[] }>();
  for (const t of trades) {
    const b = instrMap.get(t.instrument) ?? { pnl: 0, trades: 0, wins: 0, losses: 0, rValues: [] };
    b.pnl += t.pnl; b.trades++;
    if (t.result === "win") b.wins++;
    else if (t.result === "loss") b.losses++;
    if (t.riskAmount > 0) b.rValues.push(t.pnl / t.riskAmount);
    instrMap.set(t.instrument, b);
  }
  const byInstrument = Array.from(instrMap.entries()).map(([instrument, b]) => ({
    instrument,
    pnl: round2(b.pnl),
    trades: b.trades,
    wins: b.wins,
    losses: b.losses,
    winRate: round2(b.trades > 0 ? (b.wins / b.trades) * 100 : 0),
    avgR: round2(b.rValues.length > 0 ? b.rValues.reduce((s, v) => s + v, 0) / b.rValues.length : 0),
  })).sort((a, b) => b.pnl - a.pnl);

  return NextResponse.json({ equity, summary, byWeekday, rMultiple, holdTime, bySession, byInstrument });
}
