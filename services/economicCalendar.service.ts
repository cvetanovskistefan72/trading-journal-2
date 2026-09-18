export type EconomicEvent = {
  id: string;
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
};
