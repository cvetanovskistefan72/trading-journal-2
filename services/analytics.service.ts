import axiosInstance from "@/lib/axios";
import type { AnalyticsData } from "@/hooks/useAnalytics";
import type { CalendarDay } from "@/types/calendar";

export async function getAnalytics(from?: string): Promise<AnalyticsData> {
  const { data } = await axiosInstance.get<AnalyticsData>("/api/analytics/all", {
    params: from ? { from } : {},
  });
  return data;
}

export async function getCalendar(month: string): Promise<CalendarDay[]> {
  const { data } = await axiosInstance.get<CalendarDay[]>("/api/trades/calendar", {
    params: { month },
  });
  return data;
}

export async function getCalendarDay(date: string): Promise<CalendarDay> {
  const { data } = await axiosInstance.get<CalendarDay>("/api/trades/calendar", {
    params: { date },
  });
  return data;
}
