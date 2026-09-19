import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveAccount } from "@/lib/getActiveAccount";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = await getActiveAccount(user.id);
  if (!accountId) return NextResponse.json({ error: "No account found" }, { status: 404 });

  try {
    const { tradeId } = await params;
    const { imageKey, thumbnailKey } = await req.json();

    if (!imageKey || !thumbnailKey) {
      return NextResponse.json({ error: "imageKey and thumbnailKey are required" }, { status: 400 });
    }

    const trade = await prisma.trade.findFirst({
      where: { id: tradeId, accountId },
      select: { id: true },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const count = await prisma.image.count({
      where: { entityType: "trade", entityId: tradeId },
    });

    if (count >= 3) {
      return NextResponse.json({ error: "Maximum 3 images per trade" }, { status: 400 });
    }

    const image = await prisma.image.create({
      data: { entityType: "trade", entityId: tradeId, imageKey, thumbnailKey },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Save trade image error:", error);
    return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
  }
}
