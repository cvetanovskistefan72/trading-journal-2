import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") ?? "USD";
  const dateParam = searchParams.get("date");

  // Default to today in ET (where US market events are scheduled)
  const todayET = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const targetDateStr = dateParam ?? todayET;
  const targetDate = new Date(targetDateStr);

  const start = new Date(targetDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setUTCHours(23, 59, 59, 999);

  try {
    const events = await prisma.economicEvent.findMany({
      where: {
        country,
        date: { gte: start, lte: end },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(events);
  } catch (err) {
    console.error("[economic-calendar] read failed:", err);
    return NextResponse.json([], { status: 200 });
  }
}
