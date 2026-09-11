import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createImageKeys,
  createImageUploadUrl,
} from "@/services/image-server.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tradeId: string }> },
) {
  const token = await getToken({ req });

  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tradeId } = await params;

    const trade = await prisma.trade.findFirst({
      where: {
        id: tradeId,
        userId: token.sub,
      },
      select: {
        id: true,
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    if (trade._count.images >= 3) {
      return NextResponse.json(
        { error: "Maximum 3 images per trade" },
        { status: 400 },
      );
    }

    const folder = `users/${token.sub}/trades/${tradeId}`;

    const { imageKey, thumbnailKey } = createImageKeys(folder);

    const [imageUploadUrl, thumbnailUploadUrl] = await Promise.all([
      createImageUploadUrl(imageKey),
      createImageUploadUrl(thumbnailKey),
    ]);

    return NextResponse.json({
      imageKey,
      thumbnailKey,
      imageUploadUrl,
      thumbnailUploadUrl,
    });
  } catch (error) {
    console.error("Create trade image upload URLs error:", error);

    return NextResponse.json(
      { error: "Failed to create upload URLs" },
      { status: 500 },
    );
  }
}
