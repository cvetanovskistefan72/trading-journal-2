import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createImagePreviewUrl } from "@/services/image-server.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const full = req.nextUrl.searchParams.get("full") === "true";

  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  if (image.entityType === "trade") {
    const trade = await prisma.trade.findFirst({ where: { id: image.entityId, userId: user.id } });
    if (!trade) return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const url = await createImagePreviewUrl(full ? image.imageKey : image.thumbnailKey);
  return NextResponse.redirect(url);
}
