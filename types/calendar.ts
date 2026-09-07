export type CalendarTrade = {
  id: string;
  instrument: string;
  direction: "long" | "short";
  session: string;
  entryTime: string;
  exitTime: string;
  pnl: number;
  riskAmount: number;
  result: "win" | "loss" | "breakeven";
  grade: string;
  strategyName: string;
  notes: string | null;
};

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  pnl: number;
  tradeCount: number;
  result: "win" | "loss" | "breakeven";
  trades: CalendarTrade[];
};
