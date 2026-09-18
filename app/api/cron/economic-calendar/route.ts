import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  console.log("[cron] secret match:", secret === expected, "env set:", !!expected);
  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized", envSet: !!expected }, { status: 401 });
  }

  try {
    const [thisWeekRes, nextWeekRes] = await Promise.all([
      fetch(FF_THIS_WEEK),
      fetch(FF_NEXT_WEEK),
    ]);

    const [thisWeek, nextWeek]: [FFEvent[], FFEvent[]] = await Promise.all([
      thisWeekRes.ok ? thisWeekRes.json() : [],
      nextWeekRes.ok ? nextWeekRes.json() : [],
    ]);

    const allEvents: FFEvent[] = [...thisWeek, ...nextWeek];

    if (allEvents.length === 0) {
      return NextResponse.json({ message: "No events fetched", upserted: 0 });
    }

    // Upsert all events — insert new, update actuals on existing
    const result = await prisma.$transaction(
      allEvents.map((ev) =>
        prisma.economicEvent.upsert({
          where: {
            date_title_country: {
              date: new Date(ev.date),
              title: ev.title,
              country: ev.country,
            },
          },
          update: {
            actual: ev.actual || null,
            forecast: ev.forecast || null,
            previous: ev.previous || null,
            impact: ev.impact,
          },
          create: {
            title: ev.title,
            country: ev.country,
            date: new Date(ev.date),
            impact: ev.impact,
            forecast: ev.forecast || null,
            previous: ev.previous || null,
            actual: ev.actual || null,
          },
        })
      )
    );

    return NextResponse.json({ message: "OK", upserted: result.length });
  } catch (err) {
    console.error("[cron/economic-calendar] failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
