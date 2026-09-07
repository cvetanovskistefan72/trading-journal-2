export type TradeDirection = "long" | "short";
export type TradeSession = "New York" | "London" | "Asia";
export type TradeResult = "win" | "loss" | "breakeven";
export type TradeGrade = "B" | "B+" | "A-" | "A" | "A+" | "A+++";

export type TradeAnswer = {
  questionId: string;
  selectedOptions: string[];
};

export type Trade = {
  id: string;
  userId: string;
  strategyId: string;
  strategy?: { id: string; name: string };
  date: string;
  instrument: string;
  direction: TradeDirection;
  session: TradeSession;
  entryTime: string;
  exitTime: string;
  result: TradeResult;
  pnl: number;
  riskAmount: number;
  grade: TradeGrade;
  confluences: string[];
  answers: TradeAnswer[];
  notes: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTradeInput = {
  strategyId: string;
  date: string;
  instrument: string;
  direction: TradeDirection;
  session: TradeSession;
  entryTime: string;
  exitTime: string;
  result: TradeResult;
  pnl: number;
  riskAmount: number;
  grade: TradeGrade;
  confluences: string[];
  answers: TradeAnswer[];
  notes?: string;
};
