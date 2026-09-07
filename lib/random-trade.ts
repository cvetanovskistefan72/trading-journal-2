import type { Strategy } from "@/types/strategy";
import type { CreateTradeInput } from "@/types/trade";

const INSTRUMENTS = ["ES", "NQ", "GC", "YM", "CL", "RTY"] as const;
const DIRECTIONS = ["long", "short"] as const;
const SESSIONS = ["New York", "London", "Asia"] as const;
const RESULTS = ["win", "loss", "breakeven"] as const;
const GRADES = ["B", "B+", "A-", "A", "A+", "A+++"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildRandomTrade(strategies: Strategy[]): CreateTradeInput {
  if (strategies.length === 0) throw new Error("No strategies available");

  const strategy = pick(strategies);
  const result = pick(RESULTS);
  const pnl =
    result === "win"  ? +(Math.random() * 800 + 50).toFixed(2) :
    result === "loss" ? -(Math.random() * 500 + 50).toFixed(2) : 0;

  const entryHour = 8 + Math.floor(Math.random() * 6);
  const exitHour = Math.min(entryHour + Math.floor(Math.random() * 3) + 1, 23);
  const pad = (n: number) => String(n).padStart(2, "0");

  const daysAgo = Math.floor(Math.random() * 90);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);

  const confluences = strategy.confluences.length > 0
    ? strategy.confluences.slice(0, Math.floor(Math.random() * strategy.confluences.length) + 1)
    : [];

  const answers = strategy.questions.map((q) => ({
    questionId: q.id,
    selectedOptions: q.options.length > 0 ? [pick(q.options)] : [],
  }));

  return {
    strategyId: strategy.id,
    date: d.toISOString().split("T")[0],
    instrument: pick(INSTRUMENTS),
    direction: pick(DIRECTIONS),
    session: pick(SESSIONS),
    entryTime: `${pad(entryHour)}:00`,
    exitTime: `${pad(exitHour)}:00`,
    result,
    pnl,
    riskAmount: +(Math.random() * 300 + 100).toFixed(2),
    grade: pick(GRADES),
    confluences,
    answers,
  };
}
