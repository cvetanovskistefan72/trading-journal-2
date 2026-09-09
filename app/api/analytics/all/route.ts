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
      direction: true,
      grade: true,
      gradeOrder: true,
      confluences: true,
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
  const profitFactor = grossLoss === 0 ? (grossWin > 0 ? 999 : 0) : grossWin / grossLoss;
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

  // ── GRADE DISTRIBUTION ────────────────────────────────────────
  const gradeMap = new Map<string, { order: number; trades: number; wins: number; losses: number; pnl: number; rValues: number[] }>();
  for (const t of trades) {
    if (!t.grade) continue;
    const b = gradeMap.get(t.grade) ?? { order: t.gradeOrder, trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] };
    b.trades++;
    b.pnl += t.pnl;
    if (t.result === "win") b.wins++;
    else if (t.result === "loss") b.losses++;
    if (t.riskAmount > 0) b.rValues.push(t.pnl / t.riskAmount);
    gradeMap.set(t.grade, b);
  }
  const byGrade = Array.from(gradeMap.entries())
    .map(([grade, b]) => ({
      grade,
      trades: b.trades,
      wins: b.wins,
      losses: b.losses,
      winRate: b.trades > 0 ? round2((b.wins / b.trades) * 100) : 0,
      pnl: round2(b.pnl),
      avgPnl: b.trades > 0 ? round2(b.pnl / b.trades) : 0,
      avgR: b.rValues.length > 0 ? round2(b.rValues.reduce((s, v) => s + v, 0) / b.rValues.length) : 0,
    }))
    .sort((a, b) => (gradeMap.get(a.grade)!.order) - (gradeMap.get(b.grade)!.order));

  // ── STREAKS ───────────────────────────────────────────────────
  const decided = trades.filter((t) => t.result === "win" || t.result === "loss");
  let curStreak = 0;
  let curType: "win" | "loss" | null = null;
  let bestWin = 0, bestLoss = 0;
  let curWin = 0, curLoss = 0;
  for (const t of decided) {
    const isWin = t.result === "win";
    if (curType === null || (isWin ? "win" : "loss") !== curType) {
      curType = isWin ? "win" : "loss";
      curStreak = 1;
    } else {
      curStreak++;
    }
    if (isWin) { curWin = curStreak; curLoss = 0; bestWin = Math.max(bestWin, curWin); }
    else { curLoss = curStreak; curWin = 0; bestLoss = Math.max(bestLoss, curLoss); }
  }
  const streaks = {
    current: curType === null ? 0 : (curType === "win" ? curWin : -curLoss),
    currentType: curType,
    bestWin,
    bestLoss,
  };

  // ── LONG VS SHORT ─────────────────────────────────────────────
  type DirAcc = { pnl: number; trades: number; wins: number; losses: number; rValues: number[] };
  const dirAcc: Record<string, DirAcc> = {
    long:  { pnl: 0, trades: 0, wins: 0, losses: 0, rValues: [] },
    short: { pnl: 0, trades: 0, wins: 0, losses: 0, rValues: [] },
  };
  for (const t of trades) {
    const key = t.direction?.toLowerCase() === "short" ? "short" : "long";
    dirAcc[key].pnl += t.pnl;
    dirAcc[key].trades++;
    if (t.result === "win") dirAcc[key].wins++;
    else if (t.result === "loss") dirAcc[key].losses++;
    if (t.riskAmount > 0) dirAcc[key].rValues.push(t.pnl / t.riskAmount);
  }
  const longShort = (["long", "short"] as const).map((dir) => {
    const b = dirAcc[dir];
    return {
      direction: dir,
      pnl: round2(b.pnl),
      trades: b.trades,
      wins: b.wins,
      losses: b.losses,
      winRate: b.trades > 0 ? round2((b.wins / b.trades) * 100) : 0,
      avgR: b.rValues.length > 0 ? round2(b.rValues.reduce((s, v) => s + v, 0) / b.rValues.length) : 0,
      profitFactor: (() => {
        const gw = b.rValues.filter((r) => r > 0).reduce((s, r) => s + r, 0);
        const gl = Math.abs(b.rValues.filter((r) => r < 0).reduce((s, r) => s + r, 0));
        return gl === 0 ? (gw > 0 ? 999 : 0) : round2(gw / gl);
      })(),
    };
  });

  // ── WIN RATE TREND (rolling 20-trade window) ──────────────────
  const WINDOW = 20;
  const decidedTrades = trades.filter((t) => t.result === "win" || t.result === "loss");
  const winRateTrend = decidedTrades.map((t, i) => {
    if (i < WINDOW - 1) return null;
    const slice = decidedTrades.slice(i - WINDOW + 1, i + 1);
    const w = slice.filter((x) => x.result === "win").length;
    return {
      date: t.date.toISOString().slice(0, 10),
      tradeIndex: i + 1,
      winRate: round2((w / WINDOW) * 100),
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  // ── DRAWDOWN ──────────────────────────────────────────────────
  let peak = 0;
  let runningPnl = 0;
  const drawdown = equity.map((point) => {
    runningPnl = point.cumulative;
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak === 0 ? 0 : round2(((runningPnl - peak) / Math.abs(peak)) * 100);
    return { date: point.date, drawdown: dd, cumulative: runningPnl };
  });

  // ── P&L DISTRIBUTION (histogram, $100 buckets) ───────────────
  const pnlValues = trades.map((t) => t.pnl);
  const pnlMin = pnlValues.length > 0 ? Math.floor(Math.min(...pnlValues) / 100) * 100 : 0;
  const pnlMax = pnlValues.length > 0 ? Math.ceil(Math.max(...pnlValues) / 100) * 100 : 0;
  const histMap = new Map<number, { count: number; wins: number; losses: number }>();
  for (let b = pnlMin; b <= pnlMax; b += 100) histMap.set(b, { count: 0, wins: 0, losses: 0 });
  for (const t of trades) {
    const b = Math.floor(t.pnl / 100) * 100;
    const bucket = histMap.get(b) ?? { count: 0, wins: 0, losses: 0 };
    bucket.count++;
    if (t.result === "win") bucket.wins++;
    else if (t.result === "loss") bucket.losses++;
    histMap.set(b, bucket);
  }
  const pnlDistribution = Array.from(histMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([bucket, v]) => ({ bucket, label: `$${bucket}`, ...v }));

  // ── CONFLUENCE PERFORMANCE ────────────────────────────────────
  const confMap = new Map<string, { trades: number; wins: number; losses: number; pnl: number; rValues: number[] }>();
  for (const t of trades) {
    for (const c of t.confluences) {
      const b = confMap.get(c) ?? { trades: 0, wins: 0, losses: 0, pnl: 0, rValues: [] };
      b.trades++;
      b.pnl += t.pnl;
      if (t.result === "win") b.wins++;
      else if (t.result === "loss") b.losses++;
      if (t.riskAmount > 0) b.rValues.push(t.pnl / t.riskAmount);
      confMap.set(c, b);
    }
  }
  const byConfluence = Array.from(confMap.entries())
    .map(([confluence, b]) => ({
      confluence,
      trades: b.trades,
      wins: b.wins,
      losses: b.losses,
      winRate: b.trades > 0 ? round2((b.wins / b.trades) * 100) : 0,
      pnl: round2(b.pnl),
      avgR: b.rValues.length > 0 ? round2(b.rValues.reduce((s, v) => s + v, 0) / b.rValues.length) : 0,
    }))
    .sort((a, b) => b.avgR - a.avgR);

  // ── CALENDAR HEATMAP ──────────────────────────────────────────
  const calMap = new Map<string, { pnl: number; trades: number; wins: number; losses: number }>();
  for (const t of trades) {
    const key = t.date.toISOString().slice(0, 10);
    const b = calMap.get(key) ?? { pnl: 0, trades: 0, wins: 0, losses: 0 };
    b.pnl += t.pnl;
    b.trades++;
    if (t.result === "win") b.wins++;
    else if (t.result === "loss") b.losses++;
    calMap.set(key, b);
  }
  const calendarHeatmap = Array.from(calMap.entries())
    .map(([date, b]) => ({ date, pnl: round2(b.pnl), trades: b.trades, wins: b.wins, losses: b.losses }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── TIME-OF-DAY HEATMAP (hour 0–23 × Mon–Fri) ────────────────
  const TRADE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  type HourDowCell = { pnl: number; trades: number; wins: number; losses: number };
  const todMap = new Map<string, HourDowCell>();
  for (const t of trades) {
    if (!t.entryTime) continue;
    const hour = parseInt(t.entryTime.split(":")[0], 10);
    const dow = new Date(t.date).getDay(); // 0=Sun..6=Sat
    if (dow === 0 || dow === 6) continue; // skip weekends
    const key = `${hour}-${dow}`;
    const b = todMap.get(key) ?? { pnl: 0, trades: 0, wins: 0, losses: 0 };
    b.pnl += t.pnl;
    b.trades++;
    if (t.result === "win") b.wins++;
    else if (t.result === "loss") b.losses++;
    todMap.set(key, b);
  }
  // Find active hours range
  const activeHours = trades
    .filter((t) => t.entryTime)
    .map((t) => parseInt(t.entryTime.split(":")[0], 10));
  const minHour = activeHours.length > 0 ? Math.min(...activeHours) : 7;
  const maxHour = activeHours.length > 0 ? Math.max(...activeHours) : 17;
  const timeOfDay: { hour: number; day: string; avgPnl: number; trades: number; wins: number; losses: number; winRate: number }[] = [];
  for (let h = minHour; h <= maxHour; h++) {
    for (let d = 1; d <= 5; d++) {
      const b = todMap.get(`${h}-${d}`);
      timeOfDay.push({
        hour: h,
        day: TRADE_DAYS[d - 1],
        avgPnl: b && b.trades > 0 ? round2(b.pnl / b.trades) : 0,
        trades: b?.trades ?? 0,
        wins: b?.wins ?? 0,
        losses: b?.losses ?? 0,
        winRate: b && b.trades > 0 ? round2((b.wins / b.trades) * 100) : 0,
      });
    }
  }

  // ── CUMULATIVE R CURVE ────────────────────────────────────────
  let cumulativeR = 0;
  const cumulativeRCurve = trades
    .filter((t) => t.riskAmount > 0)
    .map((t, i) => {
      cumulativeR += t.pnl / t.riskAmount;
      return { date: t.date.toISOString().slice(0, 10), tradeIndex: i + 1, cumulativeR: round2(cumulativeR) };
    });

  // ── TILT METER (performance after loss streaks) ───────────────
  const decidedForTilt = trades.filter((t) => t.result === "win" || t.result === "loss");
  type TiltBucket = { trades: number; wins: number; pnl: number };
  const tiltMap: Record<string, TiltBucket> = {
    "After 0 losses": { trades: 0, wins: 0, pnl: 0 },
    "After 1 loss":   { trades: 0, wins: 0, pnl: 0 },
    "After 2 losses": { trades: 0, wins: 0, pnl: 0 },
    "After 3+ losses":{ trades: 0, wins: 0, pnl: 0 },
  };
  for (let i = 1; i < decidedForTilt.length; i++) {
    let streak = 0;
    for (let j = i - 1; j >= 0 && decidedForTilt[j].result === "loss"; j--) streak++;
    const label = streak === 0 ? "After 0 losses" : streak === 1 ? "After 1 loss" : streak === 2 ? "After 2 losses" : "After 3+ losses";
    tiltMap[label].trades++;
    tiltMap[label].pnl += decidedForTilt[i].pnl;
    if (decidedForTilt[i].result === "win") tiltMap[label].wins++;
  }
  const tiltMeter = Object.entries(tiltMap).map(([label, b]) => ({
    label,
    trades: b.trades,
    winRate: b.trades > 0 ? round2((b.wins / b.trades) * 100) : 0,
    avgPnl: b.trades > 0 ? round2(b.pnl / b.trades) : 0,
  }));

  return NextResponse.json({ equity, summary, byWeekday, rMultiple, holdTime, bySession, byInstrument, longShort, winRateTrend, byGrade, streaks, drawdown, pnlDistribution, byConfluence, calendarHeatmap, timeOfDay, cumulativeRCurve, tiltMeter });
}
