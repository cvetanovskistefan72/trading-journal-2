import { NextResponse } from "next/server";

const FF_THIS_WEEK = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const FF_NEXT_WEEK = "https://nfs.faireconomy.media/ff_calendar_nextweek.json";

interface FFEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
  actual: string;
}

export async function GET() {
  try {
    const [thisWeekRes, nextWeekRes] = await Promise.all([
      fetch(FF_THIS_WEEK, { next: { revalidate: 600 } }),
      fetch(FF_NEXT_WEEK, { next: { revalidate: 600 } }),
    ]);

    const [thisWeek, nextWeek]: [FFEvent[], FFEvent[]] = await Promise.all([
      thisWeekRes.ok ? thisWeekRes.json() : [],
      nextWeekRes.ok ? nextWeekRes.json() : [],
    ]);

    const allEvents: FFEvent[] = [...thisWeek, ...nextWeek];

    // Filter to USD events that fall on today (in local server time)
    const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    const todayUSD = allEvents
      .filter((ev) => {
        if (ev.country !== "USD") return false;
        const evDateStr = new Date(ev.date).toISOString().slice(0, 10);
        return evDateStr === todayStr;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(todayUSD);
  } catch (err) {
    console.error("[economic-calendar] fetch failed:", err);
    return NextResponse.json([], { status: 200 });
  }
}
