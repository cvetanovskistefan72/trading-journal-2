import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { b2 } from "@/lib/b2";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

const BUCKET = process.env.B2_BUCKET_NAME!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`img:${user.id}`, 60, 60_000);
  if (!rl.ok) return tooManyRequests(rl.resetAt);

  const { id } = await params;
  const full = req.nextUrl.searchParams.get("full") === "true";

  const image = await prisma.image.findUnique({ where: { id } });
  if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  if (image.entityType === "trade") {
    const trade = await prisma.trade.findFirst({ where: { id: image.entityId, userId: user.id } });
    if (!trade) return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const key = full ? image.imageKey : image.thumbnailKey;

  const obj = await b2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const body = obj.Body as ReadableStream;

  return new NextResponse(body, {
    headers: {
      "Content-Type": obj.ContentType ?? "image/webp",
      "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
