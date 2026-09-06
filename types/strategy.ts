export type QuestionType = "single" | "multi";

export type StrategyQuestion = {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
};

export type Strategy = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  confluences: string[];
  questions: StrategyQuestion[];
  createdAt: string;
  updatedAt: string;
};

export type CreateStrategyInput = {
  name: string;
  description?: string;
  confluences?: string[];
  questions?: StrategyQuestion[];
};

export type UpdateStrategyInput = Partial<CreateStrategyInput>;
