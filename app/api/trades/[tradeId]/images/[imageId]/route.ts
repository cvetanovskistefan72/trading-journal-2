import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getActiveAccount } from "@/lib/getActiveAccount";
import { deleteImageObject, createImagePreviewUrl } from "@/services/image-server.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tradeId: string; imageId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = await getActiveAccount(user.id);
  if (!accountId) return NextResponse.json({ error: "No account found" }, { status: 404 });

  const { tradeId, imageId } = await params;
  const trade = await prisma.trade.findFirst({ where: { id: tradeId, accountId }, select: { id: true } });
  if (!trade) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  const image = await prisma.image.findFirst({
    where: { id: imageId, entityType: "trade", entityId: tradeId },
  });
  if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  const url = await createImagePreviewUrl(image.thumbnailKey);
  return NextResponse.redirect(url);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tradeId: string; imageId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = await getActiveAccount(user.id);
  if (!accountId) return NextResponse.json({ error: "No account found" }, { status: 404 });

  try {
    const { tradeId, imageId } = await params;

    const trade = await prisma.trade.findFirst({ where: { id: tradeId, accountId }, select: { id: true } });
    if (!trade) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    const image = await prisma.image.findFirst({
      where: { id: imageId, entityType: "trade", entityId: tradeId },
    });
    if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    await Promise.all([
      deleteImageObject(image.imageKey),
      deleteImageObject(image.thumbnailKey),
    ]);

    await prisma.image.delete({ where: { id: imageId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete trade image error:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
