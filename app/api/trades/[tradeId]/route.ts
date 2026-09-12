import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { gradeToOrder } from "@/app/api/trades/route";
import { deleteImageObject } from "@/services/image-server.service";

type Params = Promise<{ tradeId: string }>;

export async function GET(_req: NextRequest, context: { params: Params }) {
  const { tradeId } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId: user.id },
    include: { strategy: true },
  });
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const images = await prisma.image.findMany({
    where: { entityType: "trade", entityId: tradeId },
    select: { id: true, thumbnailKey: true },
  });

  return NextResponse.json({ ...trade, images });
}

export async function DELETE(_req: NextRequest, context: { params: Params }) {
  const { tradeId } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trade = await prisma.trade.findFirst({
    where: { id: tradeId, userId: user.id },
  });
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!trade.archived) {
    return NextResponse.json({ error: "Only archived trades can be deleted." }, { status: 409 });
  }

  const images = await prisma.image.findMany({
    where: { entityType: "trade", entityId: tradeId },
    select: { imageKey: true, thumbnailKey: true },
  });

  await Promise.all(
    images.flatMap((img) => [
      deleteImageObject(img.imageKey),
      deleteImageObject(img.thumbnailKey),
    ])
  );

  await prisma.image.deleteMany({ where: { entityType: "trade", entityId: tradeId } });
  await prisma.trade.delete({ where: { id: tradeId } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, context: { params: Params }) {
  const { tradeId } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trade = await prisma.trade.findFirst({ where: { id: tradeId, userId: user.id } });
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const {
    strategyId, date, instrument, direction, session,
    entryTime, exitTime, exitDate, result, pnl, riskAmount,
    grade, confluences, answers, notes, archived,
    removedImageIds, addedImageKeys,
  } = body;

  // Delete removed images from B2 + DB
  if (Array.isArray(removedImageIds) && removedImageIds.length > 0) {
    const imagesToRemove = await prisma.image.findMany({
      where: { id: { in: removedImageIds }, entityType: "trade", entityId: tradeId },
    });
    await Promise.all(
      imagesToRemove.flatMap((img) => [
        deleteImageObject(img.imageKey),
        deleteImageObject(img.thumbnailKey),
      ])
    );
    await prisma.image.deleteMany({ where: { id: { in: removedImageIds } } });
  }

  // Save newly uploaded image keys to DB
  if (Array.isArray(addedImageKeys) && addedImageKeys.length > 0) {
    await prisma.image.createMany({
      data: addedImageKeys.map(({ imageKey, thumbnailKey }: { imageKey: string; thumbnailKey: string }) => ({
        entityType: "trade",
        entityId: tradeId,
        imageKey,
        thumbnailKey,
      })),
    });
  }

  const updated = await prisma.trade.update({
    where: { id: tradeId },
    data: {
      ...(strategyId !== undefined && { strategyId }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(instrument !== undefined && { instrument }),
      ...(direction !== undefined && { direction }),
      ...(session !== undefined && { session }),
      ...(entryTime !== undefined && { entryTime }),
      ...(exitTime !== undefined && { exitTime }),
      ...(exitDate !== undefined && { exitDate: exitDate ?? null }),
      ...(result !== undefined && { result }),
      ...(pnl !== undefined && { pnl: Number(pnl) }),
      ...(riskAmount !== undefined && { riskAmount: Number(riskAmount) }),
      ...(grade !== undefined && { grade, gradeOrder: gradeToOrder(grade) }),
      ...(confluences !== undefined && { confluences }),
      ...(answers !== undefined && { answers }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(archived !== undefined && { archived: Boolean(archived) }),
    },
    include: { strategy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
}
