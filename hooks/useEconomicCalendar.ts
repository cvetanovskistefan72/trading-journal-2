import { useQuery } from "@tanstack/react-query";
import type { EconomicEvent } from "@/services/economicCalendar.service";

async function fetchCalendar(): Promise<EconomicEvent[]> {
  const res = await fetch("/api/economic-calendar");
  if (!res.ok) return [];
  return res.json();
}

export function useEconomicCalendar() {
  return useQuery({
    queryKey: ["economic-calendar"],
    queryFn: fetchCalendar,
    staleTime: 60 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
}
