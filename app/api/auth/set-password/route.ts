import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export async function GET(req: Request) {
  // 20 lookups per IP per 15 min — token validity probing.
  const limit = rateLimit(`setpw-get:${clientIp(req)}`, 20, 15 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.resetAt);

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashToken(token),
      resetTokenExpiry: { gte: new Date() },
    },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired link" },
      { status: 400 }
    );
  }

  return NextResponse.json(user);
}

export async function POST(req: Request) {
  const limit = rateLimit(`setpw-post:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.resetAt);

  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: "Missing token or password" },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    return NextResponse.json(
      { error: "Password must be 8–72 characters" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashToken(token),
      resetTokenExpiry: { gte: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired link" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ success: true });
}
